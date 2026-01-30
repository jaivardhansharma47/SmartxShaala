// 🚀 SmartxShaala Backend - Netlify Serverless (FINAL FIXED VERSION)

const express = require("express");
const serverless = require("serverless-http");
const busboy = require("busboy");

// --------------------------------------------
// App & Router
// --------------------------------------------
const app = express();
const router = express.Router();

// --------------------------------------------
// Middleware (Netlify Compatible)
// --------------------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// --------------------------------------------
// Telegram Helper
// --------------------------------------------
async function sendTelegram(token, chatId, message) {
  try {
    const response = await fetch(
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

    return await response.json();
  } catch (err) {
    console.error("Telegram Error:", err.message);
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
    timestamp: new Date().toISOString(),
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

👤 Name: ${name}
📧 Email: ${email}
📋 Subject: ${subject || "N/A"}
💬 Message: ${message}

⏰ ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`;

    await sendTelegram(
      process.env.CONTACT_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      text
    );

    res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------------------------
// Newsletter API
// --------------------------------------------
router.post("/newsletter", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email required" });
    }

    const text = `📧 <b>NEW NEWSLETTER</b>

✉️ Email: ${email}
⏰ ${new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    })}`;

    await sendTelegram(
      process.env.NEWSLETTER_BOT_TOKEN,
      process.env.TELEGRAM_CHAT_ID,
      text
    );

    res.json({ success: true, message: "Subscribed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// --------------------------------------------
// Careers API (Resume Upload)
// --------------------------------------------
router.post("/careers", (req, res) => {
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

👤 Name: ${fields.fullName || "N/A"}
📧 Email: ${fields.email || "N/A"}
📞 Phone: ${fields.phone || "N/A"}
📋 Position: ${fields.position || "N/A"}
🎓 Qualification: ${fields.qualification || "N/A"}
📍 Location: ${fields.location || "N/A"}
📎 Resume: ${fileName || "Not uploaded"}

⏰ ${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`;

      await sendTelegram(
        process.env.CAREERS_BOT_TOKEN,
        process.env.TELEGRAM_CHAT_ID,
        text
      );

      // Send resume file
      if (fileBuffer && fileName) {
        const form = new FormData();
        form.append("chat_id", process.env.TELEGRAM_CHAT_ID);
        form.append("document", new Blob([fileBuffer]), fileName);

        await fetch(
          `https://api.telegram.org/bot${process.env.CAREERS_BOT_TOKEN}/sendDocument`,
          { method: "POST", body: form }
        );
      }

      res.json({ success: true, message: "Application submitted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  });

  if (req.rawBody) {
    bb.end(req.rawBody);
  }
});

// --------------------------------------------
// Mount Router (IMPORTANT)
// --------------------------------------------
app.use("/api", router);

// --------------------------------------------
// Netlify Export (ONLY ONCE)
// --------------------------------------------
module.exports.handler = serverless(app);
