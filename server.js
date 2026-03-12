const express = require('express');
const path = require('path');
const fs = require('fs');
const https = require('https');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'taksos1';
const GITHUB_REPO = process.env.GITHUB_REPO || '3moj00';
const DATA_PATH = process.env.DATA_FILE_PATH || './data/data.json';

// Middleware
app.use(express.json());
app.use(express.static('.'));

// CORS middleware
if (process.env.CORS_ENABLED === 'true') {
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });
}

// Logging middleware
if (process.env.DEBUG_MODE === 'true') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
    res.json({
        siteTitle: process.env.SITE_TITLE || '3moj00 - Video Editor Portfolio',
        siteDescription: process.env.SITE_DESCRIPTION || 'Professional video editing and motion graphics services',
        siteUrl: process.env.SITE_URL || `http://${HOST}:${PORT}`,
        devPanelEnabled: process.env.DEV_PANEL_ENABLED === 'true',
        devPanelSecretCode: process.env.DEV_PANEL_SECRET_CODE || '15987530',
        debugMode: process.env.DEBUG_MODE === 'true'
    });
});

// GitHub API helper function
function pushToGitHub(content, filePath) {
    return new Promise((resolve, reject) => {
        if (!GITHUB_TOKEN) {
            console.log('No GitHub token, skipping auto-push');
            resolve({ skipped: true });
            return;
        }

        const data = JSON.stringify(content, null, 2);
        const encodedData = Buffer.from(data).toString('base64');
        
        // First, get the current file's SHA
        const getOptions = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': '3moj00-Website'
            }
        };

        const getReq = https.request(getOptions, (getRes) => {
            let body = '';
            getRes.on('data', chunk => body += chunk);
            getRes.on('end', () => {
                let sha = null;
                if (getRes.statusCode === 200) {
                    try {
                        const fileInfo = JSON.parse(body);
                        sha = fileInfo.sha;
                    } catch (e) {
                        console.log('Could not parse file info');
                    }
                }
                
                // Now push with SHA
                const pushOptions = {
                    hostname: 'api.github.com',
                    path: `/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`,
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                        'User-Agent': '3moj00-Website'
                    }
                };

                const pushData = {
                    message: 'Auto-update data.json',
                    content: encodedData
                };
                if (sha) {
                    pushData.sha = sha;
                }

                const pushReq = https.request(pushOptions, (pushRes) => {
                    let pushBody = '';
                    pushRes.on('data', chunk => pushBody += chunk);
                    pushRes.on('end', () => {
                        if (pushRes.statusCode === 200 || pushRes.statusCode === 201) {
                            console.log('✅ Auto-pushed to GitHub!');
                            resolve({ success: true });
                        } else {
                            console.log('GitHub push failed:', pushRes.statusCode, pushBody);
                            reject(new Error(`GitHub API error: ${pushRes.statusCode}`));
                        }
                    });
                });

                pushReq.on('error', reject);
                pushReq.write(JSON.stringify(pushData));
                pushReq.end();
            });
        });

        getReq.on('error', reject);
        getReq.end();
    });
}

// API endpoint to update data.json
app.post('/api/data', async (req, res) => {
    try {
        const dataPath = process.env.DATA_FILE_PATH || './data/data.json';
        const data = req.body;
        
        // Add timestamp
        data.lastUpdated = new Date().toISOString();
        
        // Write to local file
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        console.log('Data updated locally');
        
        // Auto-push to GitHub
        if (GITHUB_TOKEN) {
            await pushToGitHub(data, 'data/data.json');
        }
        
        res.json({ success: true, message: 'Data updated and pushed to GitHub' });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ success: false, message: 'Error updating data' });
    }
});

// API endpoint to get data.json
app.get('/api/data', (req, res) => {
    try {
        const dataPath = process.env.DATA_FILE_PATH || './data/data.json';
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        res.json(data);
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ success: false, message: 'Error reading data' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve developer panel
app.get('/developer', (req, res) => {
    if (process.env.DEV_PANEL_ENABLED === 'true') {
        res.sendFile(path.join(__dirname, 'developer.html'));
    } else {
        res.status(403).send('Developer panel is disabled');
    }
});

// Start server
app.listen(PORT, HOST, () => {
    console.log('🚀 3moj00 Website Server Started');
    console.log(`📍 Server running at http://${HOST}:${PORT}`);
    console.log(`🔧 Developer panel: http://${HOST}:${PORT}/developer`);
    console.log(`📊 API endpoints: http://${HOST}:${PORT}/api/`);
    console.log(`⚙️  Configuration loaded from config.env`);
    console.log(`🔍 Debug mode: ${process.env.DEBUG_MODE === 'true' ? 'ON' : 'OFF'}`);
    console.log('─'.repeat(50));
});
