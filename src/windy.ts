// const windy = async (ctx: TelegrafContext, options: object) => {
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.goto(
//     "http://www.iwindsurf.com/windandwhere.iws?regionID=125&regionProductID=3&day=0&timeoffset=6&selected_model_id=211"
//   );
//   await page.screenshot({ path: "./images/iwindsurf.png" });
//   ctx.replyWithPhoto({
//     source: fs.readFileSync("./images/iwindsurf.png")
//   });

//   await browser.close();
// };
