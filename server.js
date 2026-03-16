const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_PATH = './data/data.json';
const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1482569157374509116/UoAs00F6O3JOf3rXqYoOXkFzcRCAdcecgtzljigYTSU-6w3mtWBbcRylYhG5crHIaKB3";

// Middleware
app.use(express.json());
app.use(cookieParser());

// Security Storage (Stored in RAM - resets on server restart for safety)
let activeOTP = null;
let sessionToken = null;

// Rate limiting for Discord webhook
let lastOTPRequest = 0;
const OTP_REQUEST_COOLDOWN = 60000; // 60 seconds between requests

// --- 1. SECURITY: DISCORD OTP AUTH ---

// Request OTP (Triggered by Ctrl + 15987530)
app.post('/api/auth/request', (req, res) => {
    const now = Date.now();
    if (now - lastOTPRequest < OTP_REQUEST_COOLDOWN) {
        const remaining = Math.ceil((OTP_REQUEST_COOLDOWN - (now - lastOTPRequest)) / 1000);
        return res.status(429).json({ success: false, message: `Rate limited. Try again in ${remaining} seconds.` });
    }
    lastOTPRequest = now;

    activeOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH] New OTP Generated: ${activeOTP}`);

    const payload = JSON.stringify({
        embeds: [{
            title: "🔐 Studio Command Access Request",
            description: `A login attempt was detected on the 3moj00 Developer Panel.\n\n**OTP Code:** \`${activeOTP}\``,
            color: 16739125, // #ff6b35
            fields: [
                { name: "Status", value: "Pending Verification", inline: true },
                { name: "Expires", value: "5 Minutes", inline: true }
            ],
            timestamp: new Date().toISOString()
        }]
    });

    const url = new URL(DISCORD_WEBHOOK);
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const sendRequest = (attempt = 1) => {
        const postReq = https.request(options, (postRes) => {
            let data = '';
            postRes.on('data', chunk => data += chunk);
            postRes.on('end', () => {
                if (postRes.statusCode >= 200 && postRes.statusCode < 300) {
                    res.json({ success: true });
                } else if (postRes.statusCode === 429 && attempt < 3) {
                    const retryAfter = parseInt(postRes.headers['retry-after']) || 5;
                    console.log(`⏳ Discord rate limited. Retrying in ${retryAfter}s...`);
                    setTimeout(() => sendRequest(attempt + 1), retryAfter * 1000);
                } else {
                    console.error(`❌ Discord Error: ${postRes.statusCode}`);
                    res.status(500).json({ success: false, message: "Discord rejected webhook" });
                }
            });
        });

        postReq.on('error', (err) => {
            console.error("❌ Network error:", err.message);
            res.status(500).json({ success: false, message: "Server network error" });
        });

        postReq.write(payload);
        postReq.end();
    };

    sendRequest();

    // Expire code in 5 mins
    setTimeout(() => { activeOTP = null; }, 300000);
});

// Verify OTP
app.post('/api/auth/verify', (req, res) => {
    const { code } = req.body;
    if (activeOTP && code === activeOTP) {
        // Create long unique session token
        sessionToken = Math.random().toString(36).substring(2, 15) + Date.now();
        activeOTP = null; 
        
        // Set Secure HttpOnly cookie (Lasts 4 hours)
        res.cookie('dev_session', sessionToken, { 
            maxAge: 14400000, 
            httpOnly: true, 
            sameSite: 'Lax' 
        });

        console.log("✅ Security Verified. Session Cookie Set.");
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid or expired code." });
    }
});

// --- 2. ROUTE PROTECTION ---

// Block direct access to the .html file
app.get('/developer.html', (req, res) => {
    res.redirect('/developer');
});

// Protected Route for Developer Page
app.get('/developer', (req, res) => {
    const userCookie = req.cookies.dev_session;
    
    // Validate session
    if (sessionToken && userCookie === sessionToken) {
        res.sendFile(path.join(__dirname, 'developer.html'));
    } else {
        console.warn(`[SECURITY] Blocked unauthorized entry attempt to /developer`);
        res.status(403).send(`
            <body style="background:#0a0a0a; color:#ff6b35; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                <div>
                    <h1 style="font-size:4rem; margin:0;">🔒</h1>
                    <h2 style="font-size:2rem;">403 - Access Denied</h2>
                    <p style="color:#666; max-width:400px;">Direct access to the Developer Panel is forbidden. Use the verification sequence on the home page.</p>
                    <a href="/" style="color:#fff; text-decoration:none; border:1px solid #333; padding:12px 25px; border-radius:12px; display:inline-block; margin-top:20px; font-weight:700;">Back to Home</a>
                </div>
            </body>
        `);
    }
});

// Serve other static files (css, js, images) AFTER protected routes
app.use(express.static('.'));

// --- 3. DATA API ---

// Get Unified Data
app.get('/api/data', (req, res) => {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
            res.json(data);
        } else {
            res.json({ projects: [], portfolioTabs: [], clients: [], showClients: true });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to read database" });
    }
});

// Update Data (Auto-cleans ghost items)
app.post('/api/data', (req, res) => {
    try {
        let data = req.body;

        // Cleanup: Only keep valid projects
        if (data.projects) {
            data.projects = data.projects.filter(v => v.title && v.url);
        }

        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        
        console.log(`[DATA] Database synced successfully.`);
        res.json({ success: true });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ error: "Failed to save database" });
    }
});

// --- 4. START SERVER ---
app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`🚀 3moj00 Studio: Server Running`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔐 Discord OTP Security: ACTIVE`);
    console.log('-------------------------------------------');
});
