import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import Telegraf, { ContextMessageUpdate } from "telegraf";
import { allTilesInfo$, respondWithFogImage, saveImageToDisk } from "./fog";
import {
  fortOrdProfiler$,
  saveFortOrdProfilerImageToDisk
} from "./fort-ord-profiler";
import { wunderground } from "./wunderground";

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

// Initialize the Telegraph based bot commands
const bot = new Telegraf(process.env.BOT_TOKEN as string);
bot.command("fog", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved fog request");
  respondWithFogImage(ctx, { animate: false });
});
bot.command("fogg", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved animated fog request");
  respondWithFogImage(ctx, { animate: true });
});
// bot.command("win", async (ctx: ContextMessageUpdate) => {
//   console.log("Recieved windy request");
//   windy(ctx, {});
// });
bot.command("wun", async (ctx: ContextMessageUpdate) => {
  console.log("Recieved Wunderground request");
  wunderground(ctx, {});
});
bot.launch();
