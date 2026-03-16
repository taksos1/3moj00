const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const DATA_PATH = './data/data.json';

// Middleware
app.use(express.json());

// --- 1. ROUTE PROTECTION ---

// Block direct access to the .html file
app.get('/developer.html', (req, res) => {
    res.redirect('/developer');
});

// Developer Page - Direct Access
app.get('/developer', (req, res) => {
    res.sendFile(path.join(__dirname, 'developer.html'));
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
    console.log(`🔐 Developer Access: Ctrl+15987530`);
    console.log('-------------------------------------------');
});
