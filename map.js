import { promises as fs } from 'fs';
import { resolve } from 'path';
import { Builder } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js';
import Jimp from 'jimp';
import express, { static as staticMiddleware } from 'express';
import HttpTerminator from 'http-terminator';
import getPort from 'get-port';

const { read } = Jimp;
const { createHttpTerminator } = HttpTerminator;

// chromium (or chrome) and chromedriver need to be installed
// e.g. apt install chromium-browser chromium-chromedriver

(async () => {
  const dir = process.argv[2];
  const files = await fs.readdir(dir);

  const port = await getPort();
  const url = `http://localhost:${port}/map.html`;
  const app = express();
  app.use(staticMiddleware('.'));
  const server = app.listen(port);
  const httpTerminator = createHttpTerminator({ server });

  console.log(url);

  for (const file of files) {
    if (file.slice(-4) !== '.gpx') {
      continue;
    }
    console.log(file);

    try {
      await fs.unlink('temp.png');
      await fs.unlink('temp.jpg');
      await fs.unlink('temp.gpx');
    } catch (e) {};

    await fs.copyFile(resolve(dir, file), 'temp.gpx');

    const options = new Options();
    options.addArguments('--headless');
    options.addArguments('--hide-scrollbars');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--force-device-scale-factor=2');

    const driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();

    await driver.get(url);
    await new Promise((resolve) => { setTimeout(resolve, 5000); });
    const data = await driver.takeScreenshot();

    await fs.writeFile('temp.png', data, 'base64');
    console.log(`${file} png written`);

    const png = await read('temp.png');
    await png.quality(90).writeAsync('temp.jpg');
    console.log(`${file} jpg written`);

    await fs.copyFile('temp.jpg', `${resolve(dir, file).slice(0, -4)}.jpg`);
    console.log(`${file} jpg copied`);

    fs.unlink('temp.png');
    fs.unlink('temp.jpg');
    fs.unlink('temp.gpx');
    console.log(`${file} deleted temp files`);

    await httpTerminator.terminate();
    await driver.quit();
  }
})();
