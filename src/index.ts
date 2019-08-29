import fs, { unlinkSync } from 'fs';
import { take } from 'rxjs/operators';
import Telegraf, { ContextMessageUpdate } from 'telegraf';

import { allTilesInfo$, PRODUCT_NAME } from './api';
import { spawnSync } from 'child_process';

require("dotenv").config();

const bot = new Telegraf(process.env.BOT_TOKEN as string);
bot.command("fog", async (ctx: ContextMessageUpdate) => {
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
        
          console.log(`Written ${fileName} successfully.`);
          spawnSync(`cwebp`, ['-q', '50', fileName, '-o', fileName.replace('.png', '.webp')]);
          ctx.replyWithPhoto({
            source: fs.readFileSync(fileName.replace('.png', '.webp'))
          });
          unlinkSync(fileName);
        }
      }
    );
  });
});
bot.launch();
