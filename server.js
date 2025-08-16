const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Endpoint يقبل GET و POST
app.all('/scrape', async (req, res) => {
    const url = req.query.url;
    console.log('[Node] Incoming scrape request:', url); // log

    if (!url) {
        console.log('[Node] No URL provided');
        return res.status(400).send('No URL provided');
    }

    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        console.log('[Node] Navigating to:', url);
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
        const html = await page.content();
        await browser.close();
        console.log('[Node] Successfully scraped:', url);
        res.send(html);
    } catch (err) {
        console.error('[Node] Scrape error:', err);
        res.status(500).send('Error: ' + err.message);
    }
});

// تشغيل السيرفر على كل الواجهات، بورت 3000
app.listen(3000, '0.0.0.0', () => {
    console.log('Headless server running on port 3000');
});