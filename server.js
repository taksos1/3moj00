const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_PATH = './data/data.json';

// Middleware
app.use(express.json());
app.use(cookieParser());

// Security Storage (Stored in RAM - resets on server restart for safety)
let sessionToken = null;

// --- 1. SECURITY: DISCORD OAUTH2 AUTH ---

app.post('/api/auth/discord', (req, res) => {
    const { code, redirect_uri } = req.body;
    
    if (!code || !redirect_uri) {
        return res.status(400).json({ success: false, message: "Missing required parameters." });
    }

    const CLIENT_ID = "1375243488836194325";
    const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
    
    if (!CLIENT_SECRET) {
        console.error("Missing DISCORD_CLIENT_SECRET in environment variables.");
        return res.status(500).json({ success: false, message: "Server misconfiguration: Missing Discord Client Secret." });
    }

    // Exchange code for token
    const tokenData = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri
    });
    
    console.log("[OAUTH] Exchanging Code for Token");
    console.log("[OAUTH] Sent Redirect URI:", redirect_uri);

    const tokenOptions = {
        hostname: 'discord.com',
        path: '/api/oauth2/token',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(tokenData.toString()),
            'User-Agent': '3moj00-DevPanel/1.0 (Node.js)',
            'Accept': 'application/json'
        }
    };

    const tokenReq = https.request(tokenOptions, (tokenRes) => {
        let responseBody = '';
        tokenRes.on('data', chunk => responseBody += chunk);
        tokenRes.on('end', () => {
            if (tokenRes.statusCode !== 200) {
                console.error("[OAUTH] Discord Token Error:", tokenRes.statusCode, responseBody);
                return res.status(401).json({ success: false, message: "Invalid or expired authorization code. Response: " + responseBody });
            }

            try {
                const tokenParsed = JSON.parse(responseBody);
                const accessToken = tokenParsed.access_token;
                
                // Fetch user info
                const userOptions = {
                    hostname: 'discord.com',
                    path: '/api/users/@me',
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'User-Agent': '3moj00-DevPanel/1.0 (Node.js)'
                    }
                };
                
                const userReq = https.request(userOptions, (userRes) => {
                    let userBody = '';
                    userRes.on('data', chunk => userBody += chunk);
                    userRes.on('end', () => {
                        if (userRes.statusCode !== 200) {
                            return res.status(401).json({ success: false, message: "Failed to fetch user profile." });
                        }
                        
                        try {
                            const userParsed = JSON.parse(userBody);
                            const ALLOWED_IDS = ["239183213577109504", "409023919945809920"]; // 3moj00 Discord IDs
                            
                            if (ALLOWED_IDS.includes(userParsed.id)) {
                                // Create long unique session token
                                sessionToken = Math.random().toString(36).substring(2, 15) + Date.now();
                                
                                // Set Secure HttpOnly cookie (Lasts 4 hours)
                                res.cookie('dev_session', sessionToken, { 
                                    maxAge: 14400000, 
                                    httpOnly: true, 
                                    sameSite: 'Lax' 
                                });

                                console.log("✅ Security Verified. Developer Logged In.");
                                return res.json({ success: true, user: userParsed.username });
                            } else {
                                console.warn(`[SECURITY] Unauthorized login attempt by Discord ID: ${userParsed.id} (${userParsed.username})`);
                                return res.status(403).json({ success: false, message: "Access Denied: You are not authorized." });
                            }
                        } catch (e) {
                            return res.status(500).json({ success: false, message: "Error parsing user data." });
                        }
                    });
                });
                
                userReq.on('error', () => {
                    return res.status(500).json({ success: false, message: "Network error fetching Discord profile." });
                });
                userReq.end();
                
            } catch (e) {
                return res.status(500).json({ success: false, message: "Error parsing Discord token data." });
            }
        });
    });

    tokenReq.on('error', (err) => {
        return res.status(500).json({ success: false, message: "Network error contacting Discord API." });
    });
    tokenReq.write(tokenData.toString());
    tokenReq.end();
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
