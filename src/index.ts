import { timer } from "rxjs";
import { switchMap } from "rxjs/operators";
import Telegraf from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";

import {
  fetchEdLevinCameraImage$,
  saveEdLevinCameraImageImageToDisk,
  respondWithEdLevinCameraAnimation,
} from "./ed-levin-camera";
import moment from "moment";

require("dotenv").config();

// Experimental: Hourly timer based caching for Fort Ord Profiler images
timer(0, 5 * 1000)
  .pipe(switchMap(() => fetchEdLevinCameraImage$()))
  .subscribe(saveEdLevinCameraImageImageToDisk, (err) => console.log("Error saving Fort Ord image", err));

// Initialize the Telegraph based bot commands
const bot = new Telegraf(process.env.BOT_TOKEN as string);

// // Help information
// bot.help((ctx: TelegrafContext) => {
//   if (!preProcessCommand(ctx)) {
//     return;
//   }
//   ctx.replyWithMarkdown(`*List of available commands*

// /fog for current satellite image.

// /fogg for last 2 hours fog animation
// _Note: Animation response can take upto 1 minute._

// /wun for Weather underground information for KCADALYC1

// /tide for getting tide information for the day
// `);
// });

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

// WindSock image
bot.command("ws", async (ctx: TelegrafContext) => {
  if (!preProcessCommand(ctx)) {
    return;
  }
  respondWithEdLevinCameraAnimation(ctx);
});

// // WindSock animation
// bot.command("wss", async (ctx: TelegrafContext) => {
//   if (!preProcessCommand(ctx)) {
//     return;
//   }
//   respondWithFogImage(ctx, { animate: true });
// });

bot.launch();
