import { Canvas, Image } from "canvas";
import { spawnSync } from "child_process";
import fs, { unlinkSync } from "fs";
import moment from "moment";
import { stringify } from "querystring";
import { range, Subject, timer, zip } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, reduce, switchMap, take, delay, concatMap } from "rxjs/operators";
import { ContextMessageUpdate } from "telegraf";
// @ts-ignore
import { XMLHttpRequest } from "xmlhttprequest";
import http from "http";
function createXHR() {
  return new XMLHttpRequest();
}

// http://realearth.ssec.wisc.edu/api/products?products=G17-ABI-CONUS-BAND02.100
export type FetchOptions = {
  cols: number;
  rows: number;
  query: {
    products?: string;
    labels?: string;
    background?: string;
    x: number;
    y: number;
    z: number;
  };
  time: string;
  opacity: number;
};

// http://realearth.ssec.wisc.edu/api/products?products=G17-ABI-CONUS-BAND02.100&cache=false

export const REAL_EARTH_URL = "http://realearth.ssec.wisc.edu";
export const PRODUCT_NAME = "G17-ABI-CONUS-BAND02";
export const REAL_EARTH_POSTFIX = ".100&cache=false";

export interface RealEarthMetaType {
  id: string;
  dataid: string;
  duplicate: boolean;
  reingest: boolean;
  name: string;
  description: string;
  owner: string;
  url: string;
  categories: string[];
  order: number;
  opacity: number;
  type: string;
  displaytype: string;
  projection: string;
  marker: string;
  probe: string;
  units: null;
  maxzoom: number;
  seedpolicy: number;
  static: boolean;
  released: boolean;
  fetch: boolean;
  declutter: boolean;
  outputtype: string;
  resample: string;
  processing: string;
  minutes: string;
  showlegend: boolean;
  merge: string;
  mergeproducts: string;
  serverurl: string;
  times: string[];
  notifyvalues: any[];
}

export type TileInfo = {
  url: string;
  x: number;
  y: number;
  time: string;
  img?: Image;
};

// console.log(`${REAL_EARTH_URL}/api/products?products=${PRODUCT_NAME}${REAL_EARTH_POSTFIX}`);
export const realEarthMeta$ = ajax({
  createXHR,
  url: `${REAL_EARTH_URL}/api/products?products=${PRODUCT_NAME}`
}).pipe(
  map(res => {
    const remt: RealEarthMetaType = res.response[0];
    console.log("remt.times", remt);
    return remt;
  })
);

export const tileImageWithInfo$ = (info: TileInfo) => {
  const sub: Subject<TileInfo> = new Subject();
  const tryFetch = () => {
    // http.get(info.url, function(res) {
    //   var buf = "";
    //   res.setEncoding("binary");
    //   res.on("data", function(chunk) {
    //     console.log("adding chunk");
    //     buf += chunk;
    //   });
    //   res.on("end", function() {
    //     var img = new Image();
    //     img.onload = function() {
    //       const tileInfo: TileInfo = {
    //         ...info,
    //         img
    //       };
    //       sub.next(tileInfo);
    //     };
    //     img.onerror = function(err) {
    //       console.info(
    //         "Failed loading image. " + err + " Trying again in a few seconds..."
    //       );
    //       setTimeout(tryFetch, 5000);
    //     };
    //     img.src = Buffer.from(buf, "binary");
    //   });
    // });

    const img = new Image();
    img.onload = function() {
      const canvasTemp: Canvas = new Canvas(256, 256);
      const ctxTemp = canvasTemp.getContext("2d");
      // @ts-ignore
      ctxTemp.drawImage(img, 0, 0);

      const base64Img = canvasTemp.toDataURL("image/png");
      if (base64Img.length === 494) {
        console.info("Got empty image. Trying again in a half a second...");
        setTimeout(tryFetch, 500);
      } else {
        const tileInfo: TileInfo = {
          ...info,
          img
        };
        sub.next(tileInfo);
      }
    };
    img.onerror = function(error) {
      console.info("Failed loading image. " + error + " Trying again in a few seconds...");
      setTimeout(tryFetch, 5000);
    };
    console.log(info.url);
    img.src = info.url;
  };

  tryFetch();
  return sub.pipe(take(1));
};

export const tilesInfo$ = (options: FetchOptions) => {
  return zip(range(0, options.rows), timer(0, 100), (r, i) => r).pipe(
    take(options.rows),
    concatMap(r => {
      let row = options.query.y + r;
      return zip(range(0, options.cols), timer(0, 20), (c, i) => c).pipe(
        take(options.cols),
        concatMap(c => {
          let col = options.query.x + c;
          const query = { ...options.query, x: col, y: row };
          const url = `${REAL_EARTH_URL}/api/image?${stringify(query)}&client=RealEarth&device=Browser`;
          return tileImageWithInfo$({
            url,
            x: c * 256,
            y: r * 256,
            time: options.time
          });
        })
      );
    })
  );
};

const imageInfo$ = (options: FetchOptions) => {
  const canvas: Canvas = new Canvas(options.cols * 256, options.rows * 256);
  const ctx = canvas.getContext("2d");
  const backgrounds = [
    "data:image/png;base64," + fs.readFileSync(`./images/labels-outlines.png`, { encoding: "base64" }),
    "data:image/png;base64," + fs.readFileSync(`./images/labels-google.png`, { encoding: "base64" })
  ];
  const backgroundImages = backgrounds.map(source => {
    const img = new Image();
    // img.onerror = () => console.info("Couldn't load background image");
    // img.onload = () => {
    //   console.log("loaded background image");
    // };
    img.src = source;
    return img;
  });

  return tilesInfo$(options).pipe(
    reduce<TileInfo, CanvasRenderingContext2D>((ctx, value) => {
      if (value.img) {
        ctx.globalAlpha = options.opacity ? options.opacity : 1;
        // @ts-ignore
        ctx.drawImage(value.img, value.x || 0, value.y || 0);
      }
      return ctx;
    }, ctx),
    map(() => {
      // console.log(backgroundImages);
      backgroundImages.forEach(img => ctx.drawImage(img, 0, 0));
      const drawStroked = (text: string, x: number, y: number, font: string) => {
        ctx.font = font;
        ctx.shadowColor = "rgba(255,255,255,0.6)";
        ctx.shadowBlur = 9;
        ctx.lineWidth = 4;
        ctx.strokeText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "black";
        ctx.fillStyle = "white";
        ctx.fillText(text, x, y);
      };

      const parts = options.time.split(".");
      const partDate = parts[0];
      const partTime = parts[1];
      let partString = partDate.substr(0, 4) + "/";
      partString += partDate.substr(4, 2) + "/";
      partString += partDate.substr(6, 2) + " ";
      partString += partTime.substr(0, 2) + ":";
      partString += partTime.substr(2, 2) + ":";
      partString += partTime.substr(4, 2);
      const newDate = new Date(partString + " UTC");
      const momDate = moment(newDate);
      const dateTimeString = momDate.format("MM/DD/YY, hh:mm a");
      drawStroked(dateTimeString, 315, 60, "50px Monaco");
      drawStroked("/help for more commands", 25, 750, "32px Monaco");
      return { options, base64: canvas.toDataURL("image/png") };
    })
  );
};

export const allTilesInfo$ = (animate: boolean) =>
  realEarthMeta$.pipe(
    switchMap(res => {
      console.log("res.times:", res.times);
      res.times = res.times.slice(animate ? -24 : -1).filter(time => {
        const fileName = `${PRODUCT_NAME}_${time.split(".").join("_")}`;
        console.log(fileName);
        return !fs.existsSync(`./images/${fileName}.webp`);
      });
      if (res.times.length) {
        console.log("Fetching images for", res.times);
      } else {
        console.log("No images to fetch, all of them already exist.");
      }
      return timer(0, 20).pipe(
        take(res.times.length),
        concatMap(index => {
          const options: FetchOptions = {
            rows: 3,
            cols: 4,
            query: {
              x: 162,
              y: 395,
              z: 10
            },
            time: res.times[index],
            opacity: 1
          };
          // options.query.labels = 'outlines';
          options.query.products = `${PRODUCT_NAME}_${res.times[index].split(".").join("_")}`;
          return imageInfo$(options);
        })
      );
    })
  );

export const saveImageToDisk = (val: { options: FetchOptions; base64: string }) => {
  // console.log(val.options.query);
  const fileName: string = `./images/${PRODUCT_NAME}_${val.options.time.split(".").join("_")}.png`;
  fs.writeFileSync(fileName, val.base64.replace(/^data:image\/png;base64,/, ""), "base64");
  console.log(`Written ${fileName} successfully.`);
  spawnSync(`cwebp`, ["-q", "50", fileName, "-o", fileName.replace(".png", ".webp")]);
  unlinkSync(fileName);
};

export const respondWithFogImage = (ctx: ContextMessageUpdate, { animate }: { animate: boolean }) => {
  allTilesInfo$(animate).subscribe(
    saveImageToDisk,
    err => console.log("Error", err),
    () => {
      const images = fs
        .readdirSync("./images", { withFileTypes: true })
        .filter(item => !item.isDirectory())
        .filter(item => item.name.startsWith(PRODUCT_NAME))
        .map(item => item.name);

      if (!animate) {
        ctx.replyWithPhoto({
          source: fs.readFileSync("./images/" + images[images.length - 1].replace(".png", ".webp"))
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
