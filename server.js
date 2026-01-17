// 🚀 SmartxShaala Backend - Render Production Ready
const os = require('os');
const path = require('path');
const fs = require('fs');

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// 1. MIDDLEWARE (FIRST)
// ============================================
app.use(cors({
    origin: [
        'http://localhost:3000', 
        'https://smartxshaala.onrender.com',
        'https://smartshaala.netlify.app',
        'https://www.smartshaala.com'
    ]
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 2. MULTER CONFIG (BEFORE API ROUTES)
// ============================================
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'resumes';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '_' + Math.round(Math.random() * 1E9) + 
                          path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || 
        file.mimetype.includes('word') || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, DOC, DOCX allowed'), false);
    }
};

const upload = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ============================================
// 3. API ROUTES (AFTER MULTER)
// ============================================
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        bots: {
            contact: process.env.CONTACT_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            careers: process.env.CAREERS_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            newsletter: process.env.NEWSLETTER_BOT_TOKEN ? '✅ Configured' : '❌ Missing'
        }
    });
});

app.get('/api/debug', (req, res) => {
    res.json({
        nodeVersion: process.version,
        platform: process.platform,
        port: process.env.PORT,
        env: process.env.NODE_ENV,
        telegram: {
            contactBot: process.env.CONTACT_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            careersBot: process.env.CAREERS_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            newsletterBot: process.env.NEWSLETTER_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            chatId: process.env.TELEGRAM_CHAT_ID ? '✅ OK' : '❌ MISSING'
        }
    });
});

// 🔔 CONTACT FORM API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        const telegramMsg = `🔔 <b>NEW CONTACT FORM</b>\n\n<b>🏢 SmartxShaala Pvt Ltd</b>\n═══════════════════════════════\n${name ? `👤 <b>Name:</b> ${name}` : ''}\n${email ? `📧 <b>Email:</b> ${email}` : ''}\n${subject ? `📋 <b>Subject:</b> ${subject}` : ''}\n💬 <b>Message:</b> ${message || 'No message'}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

        await sendTelegram(process.env.CONTACT_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact API error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 🎯 CAREERS FORM + RESUME UPLOAD
app.post('/api/careers', upload.single('resume'), async (req, res) => {
    try {
        const { position, fullName, email, phone, experience, qualification, location, coverLetter } = req.body;
        const resumeUrl = req.file ? `https://${req.get('host')}/resumes/${req.file.filename}` : null;

        const telegramMsg = `🎯 <b>NEW JOB APPLICATION</b>\n\n<b>🏢 SmartxShaala Careers</b>\n═══════════════════════════════\n📋 <b>Position:</b> ${position || 'Not specified'}\n👤 <b>Name:</b> ${fullName || 'N/A'}\n📧 <b>Email:</b> ${email || 'N/A'}\n📞 <b>Phone:</b> ${phone || 'N/A'}\n📊 <b>Experience:</b> ${experience || 'N/A'}\n🎓 <b>Qualification:</b> ${qualification || 'N/A'}\n📍 <b>Location:</b> ${location || 'N/A'}\n${resumeUrl ? `📎 <b>Resume:</b> ${req.file.filename}` : '📎 No resume'}\n\n💼 <b>Cover Letter:</b>\n${coverLetter || 'Not provided'}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

        await sendTelegram(process.env.CAREERS_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg, resumeUrl);
        res.json({ success: true, message: 'Application submitted!', resumeUrl });
    } catch (error) {
        console.error('Careers API error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 📧 NEWSLETTER API
app.post('/api/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        const telegramMsg = `📧 <b>NEW NEWSLETTER SUBSCRIPTION</b>\n\n<b>🏢 SmartxShaala</b>\n═══════════════════════════════\n✉️ <b>Email:</b> ${email}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

        await sendTelegram(process.env.NEWSLETTER_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg);
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Newsletter API error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ============================================
// 4. STATIC FILES (AFTER APIs)
// ============================================
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/resumes', express.static(path.join(__dirname, 'resumes')));

// ✅ SPA CATCH-ALL ROUTE
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ============================================
// 5. TELEGRAM HELPER (BOTTOM)
// ============================================
async function sendTelegram(token, chatId, message, documentUrl = null) {
    try {
        const payload = { 
            chat_id: chatId, 
            text: message,
            parse_mode: 'HTML'
        };

        if (documentUrl) {
            payload.document = documentUrl;
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('✅ Telegram:', result.ok ? 'SUCCESS' : result.description);
        return result;
    } catch (error) {
        console.error('❌ Telegram error:', error.message);
        return { ok: false };
    }
}

// ============================================
// 6. 404 HANDLER (LAST)
// ============================================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// ============================================
// 7. START SERVER
// ============================================
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n🚀 SmartxShaala Backend LIVE');
    console.log(`📍 Port: ${PORT}`);
    console.log(`🩺 Health: /api/health`);
    console.log(`🔍 Debug: /api/debug`);
    console.log(`📁 Frontend: / (SPA)`);
    console.log(`📎 Resumes: /resumes/`);
});

process.on('SIGTERM', () => {
    console.log('🛑 Shutting down gracefully...');
    server.close(() => process.exit(0));
});
