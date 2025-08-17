// server.js
const express = require('express');
const fs = require('fs');
const puppeteer = require('puppeteer-core'); // use core only
const app = express();

async function findChromium() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/snap/bin/chromium'
  ];
  for (const p of candidates) {
    if (!p) continue;
    try {
      if (fs.existsSync(p)) {
        console.log('[Node] Found chromium at', p);
        return p;
      }
    } catch (e) {}
  }
  console.log('[Node] No system chromium found in candidates.');
  return null;
}

app.all('/scrape', async (req, res) => {
  const url = req.query.url;
  console.log('[Node] Incoming scrape request:', url);
  if (!url) return res.status(400).send('No URL provided');

  let browser;
  try {
    const executablePath = await findChromium();
    if (!executablePath) {
      // Clear, actionable error
      const msg = 'No system chromium found. On Render use system chromium or install puppeteer (heavy).';
      console.error('[Node] ' + msg);
      return res.status(502).send(msg);
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: null
    });

    const page = await browser.newPage();
    console.log('[Node] Navigating to:', url);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    const html = await page.content();

    await browser.close();
    console.log('[Node] Successfully scraped:', url);
    res.send(html);
  } catch (err) {
    if (browser) await browser.close().catch(()=>{});
    console.error('[Node] Scrape error:', err);
    res.status(500).send('Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Headless server running on port ${PORT}`));
