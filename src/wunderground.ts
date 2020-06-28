import moment from "moment";
import { TelegrafContext } from "telegraf/typings/context";
import puppeteer from "puppeteer";
import fs from "fs";

export enum Station {
  kcadalyc1 = "KCADALYC1",
  kcadalyc37 = "KCADALYC37",
}

export const wunderground = async (ctx: TelegrafContext, options: { station: Station }) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(`https://www.wunderground.com/dashboard/pws/${options.station}`, { waitUntil: "networkidle0" });
  // await new Promise((r) => setTimeout(r, 5000));

  await page.evaluate(() => {
    let dom = document.querySelector("snack-bar-container");
    if (dom && dom.parentNode) {
      dom.parentNode.removeChild(dom);
    }
  });
  const element = await page.$("lib-history-chart");
  if (element == null) {
    console.log(`Couldn't fetch weather underground info for ${options.station}`);
    return;
  }
  const filename = `${options.station}-${moment().format()}.png`;
  await element.screenshot({ path: `./images/${filename}` });
  ctx.replyWithPhoto({
    source: fs.readFileSync(`./images/${filename}`),
  });

  await browser.close();

  // ctx.replyWithPhoto({
  //   url: `https://www.wunderground.com/cgi-bin/wxStationGraphAll?day=${moment().format("D")}&year=${moment().format(
  //     "Y"
  //   )}&month=${moment().format("M")}&ID=KCADALYC1&showpressure=1&type=3&width=500&showtemp=1&showwind=1&showwinddir=1`,
  //   filename: `KCADALYC1-${moment().format("M-D-Y")}.gif`,
  // });
};
