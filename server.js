const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();

app.all("/scrape", async (req, res) => {
  const url = req.query.url;
  console.log("[Node] Incoming scrape request:", url);

  if (!url) return res.status(400).send("No URL provided");

  let browser;

  try {
    const executablePath = await chromium.executablePath;

    if (!executablePath) throw new Error("No system chromium found");

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    console.log("[Node] Navigating to:", url);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    const html = await page.content();
    await browser.close();

    console.log("[Node] Successfully scraped:", url);
    res.send(html);
  } catch (err) {
    if (browser) await browser.close();
    console.error("[Node] Scrape error:", err);
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(3000, () => console.log("Headless server running on port 3000"));
