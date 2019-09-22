import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import Telegraf, { ContextMessageUpdate } from "telegraf";
import { allTilesInfo$, respondWithFogImage, saveImageToDisk } from "./fog";
import {
  fortOrdProfiler$,
  saveFortOrdProfilerImageToDisk
} from "./fort-ord-profiler";
import { wunderground } from "./wunderground";
import moment = require("moment");

require("dotenv").config();

// Experimental: Hourly timer based caching for Fort Ord Profiler images
timer(0, 60 * 1000 * 60)
  .pipe(switchMap(() => fortOrdProfiler$))
  .subscribe(saveFortOrdProfilerImageToDisk, err =>
    console.log("Error saving Fort Ord image", err)
  );

// 5 min timer based caching for fog images
timer(0, 5 * 1000 * 60)
  .pipe(switchMap(() => allTilesInfo$(false)))
  .subscribe(saveImageToDisk, err =>
    console.log("Error saving fog image", err)
  );

// Returns false if the bot decides to exit early
const preProcessCommand = (ctx: ContextMessageUpdate) => {
  if (ctx.chat && ctx.from && ctx.message) {
    console.log(
      `${ctx.from.first_name} ${ctx.from.last_name} requested for ${
        ctx.message.text
      } via ${ctx.chat.type} message at ${moment().format(
        "MM/DD/YY, hh:mm:ss a"
      )}`
    );
    if (ctx.chat.type != "private") {
      ctx.replyWithMarkdown(
        "*MR bot* now only works in private mode, try sending me `/fog` or `/fogg` in a direct chat."
      );
      return false;
    }
  }
  return true;
};

// Initialize the Telegraph based bot commands
const bot = new Telegraf(process.env.BOT_TOKEN as string);

// Help information
bot.help((ctx: ContextMessageUpdate) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  ctx.replyWithMarkdown(`*List of available commands*

/fog for current satellite image.

/fogg for last 2 hours fog animation 
_Note: Animation response can take upto 1 minute._

/wun for Weather underground information for KCADALYC1
`);
});

// Fog image
bot.command("fog", async (ctx: ContextMessageUpdate) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  respondWithFogImage(ctx, { animate: false });
});

// Fog animation
bot.command("fogg", async (ctx: ContextMessageUpdate) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  respondWithFogImage(ctx, { animate: true });
});
// bot.command("win", async (ctx: ContextMessageUpdate) => {
//   console.log("Recieved windy request");
//   windy(ctx, {});
// });
bot.command("wun", async (ctx: ContextMessageUpdate) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  wunderground(ctx, {});
});
bot.launch();
