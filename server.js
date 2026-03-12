const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: './config.env' });

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || '0.0.0.0';

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

// API endpoint to update data.json
app.post('/api/data', (req, res) => {
    try {
        const dataPath = process.env.DATA_FILE_PATH || './data/data.json';
        const data = req.body;
        
        // Add timestamp
        data.lastUpdated = new Date().toISOString();
        
        // Write to file
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        
        console.log('Data updated successfully');
        res.json({ success: true, message: 'Data updated successfully' });
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
