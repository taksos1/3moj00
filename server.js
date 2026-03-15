const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser'); // You might need to run: npm install cookie-parser
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cookieParser()); // Allows us to store the "unlocked" session
app.use(express.static('.'));

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1482569157374509116/UoAs00F6O3JOf3rXqYoOXkFzcRCAdcecgtzljigYTSU-6w3mtWBbcRylYhG5crHIaKB3";

// Temporary storage for OTP and Session
let activeOTP = null;
let sessionToken = null;

// 1. Request OTP
app.post('/api/auth/request', (req, res) => {
    activeOTP = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    
    const data = JSON.stringify({
        content: `🔑 **3moj00 Security Alert**\nSomeone is trying to access the Developer Panel.\n**Your OTP Code is: ${activeOTP}**\nThis code expires in 5 minutes.`,
        username: "Studio Security"
    });

    const url = new URL(DISCORD_WEBHOOK);
    const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const postReq = https.request(options);
    postReq.write(data);
    postReq.end();

    // Code expires in 5 mins
    setTimeout(() => { activeOTP = null; }, 300000);

    res.json({ success: true, message: "OTP sent to Discord" });
});

// 2. Verify OTP
app.post('/api/auth/verify', (req, res) => {
    const { code } = req.body;
    if (activeOTP && code === activeOTP) {
        sessionToken = Math.random().toString(36).substring(2, 15);
        activeOTP = null; // Clear OTP after use
        
        // Set a cookie that expires in 2 hours
        res.cookie('dev_session', sessionToken, { maxAge: 7200000, httpOnly: true });
        res.json({ success: true, token: sessionToken });
    } else {
        res.status(401).json({ success: false, message: "Invalid or expired code" });
    }
});

// 3. Protected Route for Developer Page
app.get('/developer', (req, res) => {
    const userCookie = req.cookies.dev_session;
    if (sessionToken && userCookie === sessionToken) {
        res.sendFile(path.join(__dirname, 'developer.html'));
    } else {
        res.status(403).send(`
            <body style="background:#0a0a0a; color:#ff6b35; display:flex; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                <div style="text-align:center;">
                    <h1>403 - Access Denied</h1>
                    <p style="color:#666">The Developer Panel is locked. Use the key sequence on the home page.</p>
                    <a href="/" style="color:#fff; text-decoration:none; border:1px solid #333; padding:10px 20px; border-radius:5px;">Back to Home</a>
                </div>
            </body>
        `);
    }
});

// --- Keep your existing /api/data routes below ---
app.get('/api/data', (req, res) => {
    const data = JSON.parse(fs.readFileSync('./data/data.json', 'utf8'));
    res.json(data);
});

app.post('/api/data', (req, res) => {
    fs.writeFileSync('./data/data.json', JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

app.listen(8000, () => { console.log('Server running on port 8000'); });
