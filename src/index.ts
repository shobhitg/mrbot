import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import Telegraf from "telegraf";
import { allTilesInfo$, respondWithFogImage, saveImageToDisk } from "./fog";
import { fortOrdProfiler$, saveFortOrdProfilerImageToDisk } from "./fort-ord-profiler";
import { wunderground, Station } from "./wunderground";
import { tide } from "./tide";
import moment = require("moment");
import { TelegrafContext } from "telegraf/typings/context";

require("dotenv").config();

// Experimental: Hourly timer based caching for Fort Ord Profiler images
// timer(0, 60 * 1000 * 60)
//   .pipe(switchMap(() => fortOrdProfiler$))
//   .subscribe(saveFortOrdProfilerImageToDisk, err =>
//     console.log("Error saving Fort Ord image", err)
//   );

// 5 min timer based caching for fog images
timer(0, 2 * 1000 * 60)
  .pipe(switchMap(() => allTilesInfo$(false)))
  .subscribe(saveImageToDisk, (err) => console.log("Error saving fog image", err));

// Returns false if the bot decides to exit early
const preProcessCommand = (ctx: TelegrafContext) => {
  if (ctx.chat && ctx.from && ctx.message) {
    console.log(
      `${ctx.from.first_name} ${ctx.from.last_name} requested for ${ctx.message.text} via ${
        ctx.chat.type
      } message at ${moment().format("MM/DD/YY, hh:mm:ss a")}`
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
bot.help((ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  ctx.replyWithMarkdown(`*List of available commands*

/fog for current satellite image.

/fogg for last 2 hours fog animation 
_Note: Animation response can take upto 1 minute._

/kcadalyc1 for Weather underground information for kcadalyc1

/kcadalyc37 for Weather underground information for kcadalyc37

/tide for getting tide information for the day
`);
});

// Fog image
bot.command("fog", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  respondWithFogImage(ctx, { animate: false });
});

// Fog animation
bot.command("fogg", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  ctx.replyWithMarkdown(
    `*Note:* it can take a few mins to respond with fog animation, that is because we don't want to overwhelm the realearth server`
  );
  respondWithFogImage(ctx, { animate: true });
});
// bot.command("win", async (ctx: TelegrafContext) => {
//   console.log("Recieved windy request");
//   windy(ctx, {});
// });
bot.command("kcadalyc1", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  wunderground(ctx, { station: Station.kcadalyc1 });
});
bot.command("kcadalyc37", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  wunderground(ctx, { station: Station.kcadalyc37 });
});

bot.command("tide", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  tide(ctx, {});
});
bot.launch();
