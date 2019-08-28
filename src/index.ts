// import Telegraf, { ContextMessageUpdate } from "telegraf";
import { fetchTiles } from "./utils";
import mergeImages from "merge-images";
import { Canvas } from "canvas";
import fs from "fs";
import { FetchOptions, allTilesInfo$ } from "./api";


require("dotenv").config();

export enum TileType {
  products = "products",
  labels = "labels",
  background = "background"
}

type FetchImageOptions = { type: TileType; name: string };
const fetchImage = ({ type, name }: FetchImageOptions) => {
  const opt: FetchOptions = {
    rows: 6,
    cols: 5,
    query: {
      // labels: "google",
      x: 161,
      y: 394,
      z: 10
    },
    time: '',
  };
  let outFileName: string = "";
  if (type === TileType.products) {
    opt.query.products = name;
    outFileName = `products-`;
  } else if (type === TileType.labels) {
    opt.query.labels = name;
    outFileName = `labels-`;
  } else if (type === TileType.background) {
    opt.query.background = name;
    outFileName = `background-`;
  }

  console.log(outFileName);

  return fetchTiles(opt);
  //.then((b64: string) => {
  // var base64Data = b64.replace(/^data:image\/png;base64,/, "");

  // fs.writeFile(`${outFileName}${name}.png`, base64Data, "base64", function(
  //   err: Error
  // ) {
  //   console.log(err);
  // });
  // });
};

const productName = "G17-ABI-CONUS-BAND02_20190822_224619";

const fetchCombinedImage = async (productName: string) => {
  console.log(productName);
  let images = await Promise.all([
    fetchImage({
      type: TileType.products,
      name: productName
    })
    // fetchImage({
    //   type: TileType.labels,
    //   name: 'outlines',
    // }),
    // fetchImage({
    //   type: TileType.labels,
    //   name: 'google',
    // }),
  ]);
  // console.log(fs.readFileSync(`./labels-outlines.png`, { encoding: "base64" }).slice(0,512))
  console.log("fetched images, merging them.");
  images = [
    ...images,
    'data:image\/png;base64,'+fs.readFileSync(`./labels-outlines.png`, { encoding: "base64" }),
    'data:image\/png;base64,'+fs.readFileSync(`./labels-google.png`, { encoding: "base64" }),
  ];
  images.forEach(b64 => console.log(b64.slice(0, 512)));
  return mergeImages(images, {
    Canvas,
    format: "png",
    quality: 1.0
  });
  // .then((b64: string) => {
  //   var base64Data = b64.replace(/^data:image\/png;base64,/, "");
  //   console.log('Writing to out file');
  //   fs.writeFile(`out.png`, base64Data, "base64", function(
  //     err: Error
  //   ) {
  //     console.log(err);
  //   });
  // });
};

console.log(productName, fetchCombinedImage);


allTilesInfo$.subscribe(v => console.log(`${v.time} - ${v.url} ${v.x} ${v.y}`));






// fetchImage({
//   type: TileType.labels,
//   name: 'google',
// });

// fetchImage({
//   type: TileType.labels,
//   name: 'outlines',
// });

// fetchImage({
//   type: TileType.products,
//   name: productName,
// });

// mergeImages([
//   { src: 'labels-google.png' },
//   { src: 'labels-outline.png', opacity: 0.7 },
//   // { src: `products-${productName}.png`, opacity: 0.3 }
// ],
// {
//   Canvas,
//   quality: 1.0
// }).then((b64: string) => {
//   var base64Data = b64.replace(/^data:image\/png;base64,/, "");

//   fs.writeFile(`out-${productName}.png`, base64Data, "base64", function(
//     err: Error
//   ) {
//     console.log(err);
//   });
// });

















// const bot = new Telegraf(process.env.BOT_TOKEN as string);
// bot.start((ctx: ContextMessageUpdate) => ctx.reply("Welcome"));
// bot.help((ctx: ContextMessageUpdate) => ctx.reply("Send me a sticker"));
// bot.on("sticker", (ctx: ContextMessageUpdate) => ctx.reply("👍"));
// bot.hears("hi", (ctx: ContextMessageUpdate) => ctx.reply("Hey there"));
// bot.command("oldschool", (ctx: ContextMessageUpdate) => ctx.reply("Hello"));
// bot.command("modern", (ctx: ContextMessageUpdate) => ctx.reply("Yo"));
// bot.command("hipster", (ctx: ContextMessageUpdate) => ctx.reply("λ"));
// bot.command("/fog", async (ctx: ContextMessageUpdate) => {
//   console.log("Recieved fog request");
//   const b64 = await fetchCombinedImage(productName);
//   console.log("Fetched merged fog image");
//   console.log(b64.slice(0, 512));

//   var base64Data = b64.replace(/^data:image\/png;base64,/, "");

//   fs.writeFileSync(`out-${productName}.png`, base64Data, "base64");

//   // const source = Buffer.from(b64, "base64");
//   // const source = stringToStream(b64, "base64");

//   // console.log('Done creating a buffer');
//   return ctx.replyWithPhoto({
//     source: fs.readFileSync(`out-${productName}.png`)
//   });
// });
// bot.launch();
