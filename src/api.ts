import { Canvas, Image } from "canvas";
import fs from "fs";
import { stringify } from "querystring";
import { range, Subject, timer } from "rxjs";
import { ajax } from "rxjs/ajax";
import { map, mergeMap, reduce, switchMap, take } from "rxjs/operators";
// @ts-ignore
import { XMLHttpRequest } from "xmlhttprequest";
import moment from "moment";

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

// http://realearth.ssec.wisc.edu/api/products?products=G17-ABI-CONUS-BAND02.100

export const REAL_EARTH_URL = "http://realearth.ssec.wisc.edu";
export const PRODUCT_NAME = "G17-ABI-CONUS-BAND02";

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

console.log(`${REAL_EARTH_URL}/api/products?products=${PRODUCT_NAME}`);

export const realEarthMeta$ = ajax({
  createXHR,
  url: `${REAL_EARTH_URL}/api/products?products=${PRODUCT_NAME}`
}).pipe(
  map(res => {
    const remt: RealEarthMetaType = res.response[0];
    return remt;
  })
);
// .pipe(map((res) => res.times));

export const tileImageWithInfo$ = (info: TileInfo) => {
  const sub: Subject<TileInfo> = new Subject();
  const tryFetch = () => {
    const img = new Image();
    img.onload = function() {
      const tileInfo: TileInfo = {
        ...info,
        img
      };
      sub.next(tileInfo);
    };
    img.onerror = function(error) {
      console.error(
        "Failed loading image. " + error + " Trying again in a few seconds..."
      );
      setTimeout(tryFetch, 5000);
    };
    img.src = info.url;
  };

  tryFetch();
  return sub.pipe(take(1));
};

export const tilesInfo$ = (options: FetchOptions) => {
  return range(0, options.rows).pipe(
    mergeMap(r => {
      let row = options.query.y + r;
      return range(0, options.cols).pipe(
        mergeMap(c => {
          let col = options.query.x + c;
          const query = { ...options.query, x: col, y: row };
          const url = `${REAL_EARTH_URL}/api/image?${stringify(query)}`;
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
    "data:image/png;base64," +
      fs.readFileSync(`./images/labels-outlines.png`, { encoding: "base64" }),
    "data:image/png;base64," +
      fs.readFileSync(`./images/labels-google.png`, { encoding: "base64" })
  ];
  const backgroundImages = backgrounds.map(source => {
    const img = new Image();
    // img.onerror = () => console.error("Couldn't load background image");
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
      const drawStroked = (text: string, x: number, y: number) => {
        ctx.font = "50px Monaco";
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
      drawStroked(dateTimeString, 315, 60);
      return { options, base64: canvas.toDataURL("image/png") };
    })
  );
};

export const allTilesInfo$ = (animate: boolean) =>
  realEarthMeta$.pipe(
    switchMap(res => {
      res.times = res.times.slice(animate ? -24 : -1).filter(time => {
        const fileName = `${PRODUCT_NAME}_${time.split(".").join("_")}`;
        return !fs.existsSync(`./images/${fileName}.webp`);
      });
      if (res.times.length) {
        console.log("Fetching images for", res.times);
      } else {
        console.log("No images to fetch, all of them already exist.");
      }
      return timer(0, 1000).pipe(
        take(res.times.length),
        mergeMap(index => {
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
          options.query.products = `${PRODUCT_NAME}_${res.times[index]
            .split(".")
            .join("_")}`;
          return imageInfo$(options);
        })
      );
    })
  );
