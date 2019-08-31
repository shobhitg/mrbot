import fs, { unlinkSync } from "fs";
// import { take, tap } from "rxjs/operators";
import Telegraf, { ContextMessageUpdate } from "telegraf";

import { allTilesInfo$, PRODUCT_NAME, FetchOptions } from "./api";
import { spawnSync } from "child_process";
import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import moment from "moment";

require("dotenv").config();

const nextFn = (val: { options: FetchOptions; base64: string }) => {
  // console.log(val.options.query);
  const fileName: string = `./images/${PRODUCT_NAME}_${val.options.time
    .split(".")
    .join("_")}.png`;
  fs.writeFileSync(
    fileName,
    val.base64.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
  console.log(`Written ${fileName} successfully.`);
  spawnSync(`cwebp`, [
    "-q",
    "50",
    fileName,
    "-o",
    fileName.replace(".png", ".webp")
  ]);
  unlinkSync(fileName);
};

const response = (
  ctx: ContextMessageUpdate,
  { animate }: { animate: boolean }
) => {
  if (ctx.chat && ctx.from && ctx.message) {
    console.log(`${ctx.from.first_name} ${ctx.from.last_name} requested for ${ctx.message.text} at ${moment().format("MM/DD/YY, hh:mm a")}`);
  }
  allTilesInfo$(animate).subscribe(
    nextFn,
    err => console.log("Error", err),
    () => {
      const images = fs
        .readdirSync("./images", { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .filter(item => item.name.startsWith(PRODUCT_NAME))
        .map(item => item.name);

      if (!animate) {
        ctx.replyWithPhoto({
          source: fs.readFileSync(
            "./images/" + images[images.length - 1].replace(".png", ".webp")
          )
        });
        return;
      }

      const flatten_loop = (arr: Array<any>) => {
        let stack: Array<string> = [];
        let item;

        while ((item = arr.shift()) !== undefined) {
          if (Array.isArray(item)) {
            arr = item.concat(arr);
          } else {
            stack.push(item);
          }
        }

        return stack;
      };
      const args = flatten_loop(
        images
          .slice(-24)
          .map(name => `./images/${name}`)
          .map(image => ["-delay", "0", image])
      );

      spawnSync(`convert`, [
        ...args,
        "-delay",
        "200",
        images
          .slice(-1)
          .map(name => `./images/${name}`)
          .join(" "),
        "-loop",
        "0",
        "./images/fog-last-two-hours.gif"
      ]);
      // convert -delay 0 images/G* -delay 50 images/G17-ABI-CONUS-BAND02_20190830_165119.webp -loop 0 out.gif

      ctx.replyWithDocument({
        source: fs.readFileSync("./images/fog-last-two-hours.gif"),
        filename: "fog-last-two-hours.gif"
      });
    }
  );
};

timer(0, 5 * 1000 * 60)
  .pipe(switchMap(() => allTilesInfo$(false)))
  .subscribe(nextFn, err => console.log("Error", err));

const bot = new Telegraf(process.env.BOT_TOKEN as string);
bot.command("fog", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved fog request");
  response(ctx, { animate: false });
});
bot.command("fogg", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved animated fog request");
  response(ctx, { animate: true });
});
bot.launch();
