// 🚀 SmartxShaala Backend - NETLIFY Production Ready (FIXED)
const express = require('express');
const serverless = require('serverless-http');
const busboy = require('busboy');

const app = express();
const router = express.Router();

// ============================================
// 1. MIDDLEWARE (Netlify Compatible)
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// 2. TELEGRAM HELPER FUNCTION
// ============================================
async function sendTelegram(token, chatId, message) {
    try {
        const payload = { 
            chat_id: chatId, 
            text: message,
            parse_mode: 'HTML'
        };

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
// 3. API ROUTES (All Working!)
// ============================================

// Health Check
router.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: 'netlify-production',
        platform: 'Netlify Functions',
        bots: {
            contact: process.env.CONTACT_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            careers: process.env.CAREERS_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
            newsletter: process.env.NEWSLETTER_BOT_TOKEN ? '✅ Configured' : '❌ Missing'
        }
    });
});

// Debug
router.get('/debug', (req, res) => {
    res.json({
        nodeVersion: process.version,
        platform: process.platform,
        telegram: {
            contactBot: process.env.CONTACT_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            careersBot: process.env.CAREERS_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            newsletterBot: process.env.NEWSLETTER_BOT_TOKEN ? '✅ OK' : '❌ MISSING',
            chatId: process.env.TELEGRAM_CHAT_ID ? '✅ OK' : '❌ MISSING'
        }
    });
});

// 🔔 CONTACT FORM API
router.post('/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Name, email, message required' });
        }

        const telegramMsg = `🔔 <b>NEW CONTACT FORM</b>\n\n<b>🏢 SmartxShaala Pvt Ltd</b>\n═══════════════════════════════\n👤 <b>Name:</b> ${name}\n📧 <b>Email:</b> ${email}\n${subject ? `📋 <b>Subject:</b> ${subject}\n` : ''}💬 <b>Message:</b> ${message}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

        await sendTelegram(process.env.CONTACT_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg);
        res.json({ success: true, message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Contact API error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 📧 NEWSLETTER API
router.post('/newsletter', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email required' });
        }

        const telegramMsg = `📧 <b>NEW NEWSLETTER SUBSCRIPTION</b>\n\n<b>🏢 SmartxShaala</b>\n═══════════════════════════════\n✉️ <b>Email:</b> ${email}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

        await sendTelegram(process.env.NEWSLETTER_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg);
        res.json({ success: true, message: 'Subscribed successfully!' });
    } catch (error) {
        console.error('Newsletter API error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// 🎯 CAREERS FORM + RESUME UPLOAD (Netlify Compatible)
router.post('/careers', (req, res) => {
    const bb = busboy({ headers: req.headers });
    let formData = {};
    let fileData = null;
    let fileName = '';

    bb.on('field', (name, value) => {
        formData[name] = value;
    });

    bb.on('file', (name, file, info) => {
        const { filename, mimeType } = info;
        fileName = filename;
        const chunks = [];
        
        file.on('data', (chunk) => chunks.push(chunk));
        file.on('end', () => {
            fileData = Buffer.concat(chunks);
        });
    });

    bb.on('finish', async () => {
        try {
            const { position, fullName, email, phone, experience, qualification, location, coverLetter } = formData;
            
            const telegramMsg = `🎯 <b>NEW JOB APPLICATION</b>\n\n<b>🏢 SmartxShaala Careers</b>\n═══════════════════════════════\n📋 <b>Position:</b> ${position || 'Not specified'}\n👤 <b>Name:</b> ${fullName || 'N/A'}\n📧 <b>Email:</b> ${email || 'N/A'}\n📞 <b>Phone:</b> ${phone || 'N/A'}\n📊 <b>Experience:</b> ${experience || 'N/A'}\n🎓 <b>Qualification:</b> ${qualification || 'N/A'}\n📍 <b>Location:</b> ${location || 'N/A'}\n${fileName ? `📎 <b>Resume:</b> ${fileName}` : '📎 No resume'}\n\n💼 <b>Cover Letter:</b>\n${coverLetter || 'Not provided'}\n\n⏰ <b>${new Date().toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'})}</b>`;

            // Send application details
            await sendTelegram(process.env.CAREERS_BOT_TOKEN, process.env.TELEGRAM_CHAT_ID, telegramMsg);

            // Send resume file to Telegram
            if (fileData && fileName) {
                const formDataTelegram = new FormData();
                formDataTelegram.append('chat_id', process.env.TELEGRAM_CHAT_ID);
                formDataTelegram.append('document', new Blob([fileData]), fileName);
                formDataTelegram.append('caption', `📎 Resume from ${fullName || 'Applicant'}`);
                formDataTelegram.append('parse_mode', 'HTML');
                
                await fetch(`https://api.telegram.org/bot${process.env.CAREERS_BOT_TOKEN}/sendDocument`, {
                    method: 'POST',
                    body: formDataTelegram
                });
            }

            res.json({ success: true, message: 'Application submitted!', resumeUploaded: !!fileData });
        } catch (error) {
            console.error('Careers API error:', error);
            res.status(500).json({ success: false, message: 'Server error' });
        }
    });

    // Pipe request to busboy
    if (req.rawBody) {
        bb.end(req.rawBody);
    }
});

// ============================================
// 4. ROUTER SETUP (Fixed for Netlify)
// ============================================
app.use('/api', router);

// ============================================
// 5. Netlify Function Export
// ============================================
module.exports.handler = serverless(app);

const express = require('express');
const serverless = require('serverless-http');
const busboy = require('busboy');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ... your routes defined as router.get('/health'), router.post('/contact'), etc.

app.use('/', router);      // ✅ mount router at root

module.exports.handler = serverless(app);   // ✅ ONLY export handler
