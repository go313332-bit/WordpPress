const express = require("express");
const chromium = require("chrome-aws-lambda");
const puppeteer = require("puppeteer-core");

const app = express();

app.all("/scrape", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("No URL provided");

  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
    const html = await page.content();
    await browser.close();

    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

app.listen(3000, () => console.log("Server running on port 3000"));