import { promises as fs } from 'fs';
import path from 'path';
import Webdriver from 'selenium-webdriver';
import Chrome from 'selenium-webdriver/chrome.js';
import Jimp from 'jimp';
import express from 'express';
import HttpTerminator from 'http-terminator';
import getPort from 'get-port';
import { fileURLToPath } from 'url';

// chromium (or chrome) and chromedriver need to be installed
// e.g. apt install chromium-browser chromium-chromedriver

const localdir = path.dirname(fileURLToPath(import.meta.url));
const tempfile = path.resolve(localdir, 'temp.gpx');

(async () => {
  const dir = process.argv[2];
  const files = await fs.readdir(dir);

  const port = await getPort();
  const url = `http://localhost:${port}/map.html`;
  const httpTerminator = HttpTerminator.createHttpTerminator({
    server: express().use(express.static(localdir)).listen(port)
  });
  console.log(url);

  const options = new Chrome.Options();
  options.addArguments('--headless');
  options.addArguments('--hide-scrollbars');
  options.addArguments('--disable-gpu');
  options.addArguments('--window-size=1920,1080');
  options.addArguments('--force-device-scale-factor=2');

  const driver = await new Webdriver.Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  for (const file of files) {
    if (file.slice(-4) !== '.gpx') {
      continue;
    }
    console.log(file);

    try { await fs.unlink(tempfile); } catch (e) { /* don't care */ }

    await fs.copyFile(path.resolve(dir, file), tempfile);
    await driver.get(url);
    await new Promise((resolve) => { setTimeout(resolve, 5000); });
    const screenshot = await driver.takeScreenshot();
    const png = await Jimp.read(Buffer.from(screenshot, 'base64'));
    await png.quality(90).writeAsync(`${path.resolve(dir, file).slice(0, -4)}.jpg`);
    console.log(`${file} jpg written`);

    try { await fs.unlink(tempfile); } catch (e) { /* don't care */ }
  }

  await Promise.all([
    httpTerminator.terminate(),
    driver.quit()
  ]);
  console.log('complete');
})();
