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
app.use(express.static('.'));

// Security Storage (Reset on server restart)
let activeOTP = null;
let sessionToken = null;

// Ensure Data Directory Exists
if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

// --- SECURITY: DISCORD OTP AUTH ---

// 1. Request OTP (Triggered by Ctrl + 15987530)
app.post('/api/auth/request', (req, res) => {
    activeOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AUTH] New OTP Generated: ${activeOTP}`);

    const payload = JSON.stringify({
        embeds: [{
            title: "🔐 Studio Access Request",
            description: `A login attempt was detected on the 3moj00 Developer Panel.\n\n**OTP Code:** \`${activeOTP}\``,
            color: 16739125, // #ff6b35
            footer: { text: "This code will expire in 5 minutes." },
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

    const postReq = https.request(options, (postRes) => {
        if (postRes.statusCode >= 200 && postRes.statusCode < 300) {
            console.log("✅ OTP sent to Discord successfully.");
            res.json({ success: true });
        } else {
            console.error(`❌ Discord Webhook failed: ${postRes.statusCode}`);
            res.status(500).json({ success: false, message: "Discord rejected the message" });
        }
    });

    postReq.on('error', (err) => {
        console.error("❌ Network error sending to Discord:", err.message);
        res.status(500).json({ success: false, message: "Server network error" });
    });

    postReq.write(payload);
    postReq.end();

    // Expire code in 5 mins
    setTimeout(() => { activeOTP = null; }, 300000);
});

// 2. Verify OTP
app.post('/api/auth/verify', (req, res) => {
    const { code } = req.body;
    if (activeOTP && code === activeOTP) {
        // Create a unique session token
        sessionToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        activeOTP = null; 
        
        // Set an HttpOnly cookie (Lasts 4 hours)
        res.cookie('dev_session', sessionToken, { 
            maxAge: 14400000, 
            httpOnly: true, 
            sameSite: 'Lax' 
        });

        console.log("✅ OTP Verified. Session Started.");
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: "Invalid or expired code." });
    }
});

// 3. Protected Route for Developer Page
app.get('/developer', (req, res) => {
    const userCookie = req.cookies.dev_session;
    // Check if session exists and cookie matches the current server session
    if (sessionToken && userCookie === sessionToken) {
        res.sendFile(path.join(__dirname, 'developer.html'));
    } else {
        console.warn(`[SECURITY] Blocked unauthorized access attempt to /developer`);
        res.status(403).send(`
            <body style="background:#0a0a0a; color:#ff6b35; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif; text-align:center;">
                <div>
                    <h1 style="font-size:3rem;">🔒 403</h1>
                    <h2>Access Denied</h2>
                    <p style="color:#666">You must verify your identity from the Home Page.</p>
                    <a href="/" style="color:#fff; text-decoration:none; border:1px solid #333; padding:10px 20px; border-radius:10px; display:inline-block; margin-top:20px;">Return Home</a>
                </div>
            </body>
        `);
    }
});

// --- DATA API: UNIFIED JSON SYSTEM ---

// Get Data
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

        // Clean Ghost Items: Only keep videos with titles and URLs
        if (data.projects) {
            data.projects = data.projects.filter(v => v.title && v.url);
        }

        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
        
        console.log(`[DATA] Database updated and cleaned.`);
        
        // Optional: Trigger GitHub Sync if GITHUB_TOKEN exists
        if (process.env.GITHUB_TOKEN) {
            pushToGitHub(data);
        }

        res.json({ success: true });
    } catch (error) {
        console.error("Save Error:", error);
        res.status(500).json({ error: "Failed to save database" });
    }
});

// --- GITHUB AUTO-PUSH LOGIC (Optional) ---
function pushToGitHub(content) {
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO; // e.g., "taksos1/3moj00"
    
    if (!GITHUB_TOKEN || !GITHUB_REPO) return;

    const filePath = "data/data.json";
    const encodedData = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');
    
    // Logic to get SHA and then PUT to GitHub...
    // (This is standard GitHub API boilerplate)
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log('-------------------------------------------');
    console.log(`🚀 3moj00 Studio Server Live`);
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔐 Security: Discord OTP + Session Cookie`);
    console.log('-------------------------------------------');
});
