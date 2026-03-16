const https = require('https');

const DISCORD_WEBHOOK = "https://discord.com/api/webhooks/1482569157374509116/UoAs00F6O3JOf3rXqYoOXkFzcRCAdcecgtzljigYTSU-6w3mtWBbcRylYhG5crHIaKB3";

const activeOTP = "123456";
const payload = JSON.stringify({
    content: "Test without User-Agent"
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
    let data = '';
    postRes.on('data', chunk => data += chunk);
    postRes.on('end', () => {
        console.log("No User-Agent Status:", postRes.statusCode);
        console.log("Response:", data);
        
        // NOW TEST WITH USER-AGENT
        const payload2 = JSON.stringify({
            content: "Test WITH User-Agent"
        });
        const options2 = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload2),
                'User-Agent': '3moj00-DevPanel/1.0 (Node.js)'
            }
        };
        const postReq2 = https.request(options2, (postRes2) => {
            let data2 = '';
            postRes2.on('data', chunk => data2 += chunk);
            postRes2.on('end', () => {
                console.log("With User-Agent Status:", postRes2.statusCode);
                console.log("Response:", data2);
            });
        });
        postReq2.write(payload2);
        postReq2.end();

    });
});

postReq.write(payload);
postReq.end();
