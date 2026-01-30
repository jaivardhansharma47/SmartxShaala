// 🚀 SmartxShaala Backend – Netlify Serverless (FINAL STABLE)

const express = require("express");
const serverless = require("serverless-http");
const busboy = require("busboy");

// --------------------------------------------
// App & Router
// --------------------------------------------
const app = express();
const router = express.Router();

// --------------------------------------------
// Conditional Body Parsers (IMPORTANT)
// Prevent multipart uploads from breaking
// --------------------------------------------
app.use((req, res, next) => {
  if (req.path === "/api/careers") return next();
  express.json({ limit: "10mb" })(req, res, next);
});

app.use((req, res, next) => {
  if (req.path === "/api/careers") return next();
  express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
});

// --------------------------------------------
// Telegram Helper
// --------------------------------------------
async function sendTelegram(token, chatId, message) {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Telegram error:", err.message);
    return { ok: false };
  }
}

// --------------------------------------------
// Health Check
// --------------------------------------------
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    platform: "Netlify Functions",
    time: new Date().toISOString(),
  });
});

// --------------------------------------------
// Contact API
// --------------------------------------------
router.post("/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ success: false, message: "Missing fields" });
    }

    const text = `🔔 <b>NEW CONTACT</b>

👤 ${name}
📧 ${email}
📋 ${subject || "N/A"}
💬 ${message}

⏰ ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`;

    await sendTelegram(
      process.env.CONTACT_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      text
    );

    res.json({ success: true, message: "Message sent" });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------------------------
// Newsletter API
// --------------------------------------------
router.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email required" });

    const text = `📧 <b>NEWSLETTER SUB</b>

✉️ ${email}
⏰ ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`;

    await sendTelegram(
      process.env.NEWSLETTER_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      text
    );

    res.json({ success: true, message: "Subscribed" });
  } catch (err) {
    console.error("Newsletter error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------------------------
// Careers API (Multipart FIXED)
// --------------------------------------------
router.post("/careers", (req, res) => {
  try {
    const bb = busboy({ headers: req.headers });

    let fields = {};
    let fileBuffer = null;
    let fileName = "";

    bb.on("field", (name, value) => {
      fields[name] = value;
    });

    bb.on("file", (name, file, info) => {
      fileName = info.filename;
      const chunks = [];

      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bb.on("finish", async () => {
      try {
        const text = `🎯 <b>NEW JOB APPLICATION</b>

👤 ${fields.fullName || "N/A"}
📧 ${fields.email || "N/A"}
📞 ${fields.phone || "N/A"}
📋 ${fields.position || "N/A"}
🎓 ${fields.qualification || "N/A"}
📍 ${fields.location || "N/A"}
📎 ${fileName || "No resume"}

⏰ ${new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}`;

        await sendTelegram(
          process.env.CAREERS_BOT_TOKEN,
          process.env.TELEGRAM_CHAT_ID,
          text
        );

        if (fileBuffer && fileName) {
          const form = new FormData();
          form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
          form.append("document", new Blob([fileBuffer]), fileName);

          await fetch(
            `https://api.telegram.org/bot${process.env.CAREERS_BOT_TOKEN}/sendDocument`,
            { method: "POST", body: form }
          );
        }

        res.json({
          success: true,
          message: "Application submitted",
        });
      } catch (err) {
        console.error("Careers finish error:", err);
        res.status(500).json({ success: false, message: "Server error" });
      }
    });

    req.pipe(bb);
  } catch (err) {
    console.error("Careers crash:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------------------------
// Mount Router
// --------------------------------------------
app.use("/api", router);

// --------------------------------------------
// Netlify Export (ONLY ONCE)
// --------------------------------------------
module.exports.handler = serverless(app);
