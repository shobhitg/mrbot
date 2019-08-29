import fs from 'fs';
import { take } from 'rxjs/operators';
import Telegraf, { ContextMessageUpdate } from 'telegraf';

import { allTilesInfo$, PRODUCT_NAME } from './api';

require("dotenv").config();




const bot = new Telegraf(process.env.BOT_TOKEN as string);
bot.start((ctx: ContextMessageUpdate) => ctx.reply("Welcome"));
bot.help((ctx: ContextMessageUpdate) => ctx.reply("Send me a sticker"));
bot.on("sticker", (ctx: ContextMessageUpdate) => ctx.reply("👍"));
bot.hears("hi", (ctx: ContextMessageUpdate) => ctx.reply("Hey there"));
bot.command("oldschool", (ctx: ContextMessageUpdate) => ctx.reply("Hello"));
bot.command("modern", (ctx: ContextMessageUpdate) => ctx.reply("Yo"));
bot.command("hipster", (ctx: ContextMessageUpdate) => ctx.reply("λ"));
bot.command("/fog", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved fog request");

  allTilesInfo$.pipe(take(1)).subscribe(val => {
    console.log(val.options.query);
    const fileName: string = `./images/${PRODUCT_NAME}_${val.options.time
      .split(".")
      .join("_")}.png`;
    fs.writeFile(
      fileName,
      val.base64.replace(/^data:image\/png;base64,/, ""),
      "base64",
      function(err: NodeJS.ErrnoException | null) {
        if (err) {
          console.log("Error writing file:", err);
        } else {
          ctx.replyWithPhoto({
            source: fs.readFileSync(fileName)
          });
        
          console.log(`Written ${fileName} successfully.`);
        }
      }
    );
  });
});
bot.launch();
