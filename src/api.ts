import { ajax } from "rxjs/ajax";
import { switchMap, map, mergeMap } from "rxjs/operators";
import { range, of } from "rxjs";
import { stringify } from "querystring";

// @ts-ignore
import { XMLHttpRequest } from "xmlhttprequest";

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
  image?: ArrayBuffer;
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

export const tileImageWithInfo$ = (info: TileInfo) =>
  ajax({ createXHR, url: info.url, responseType: 'arraybuffer' }).pipe(
    switchMap(res => {
      return of({
        ...info,
        image: res.response
      });
    })
  );

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
  // const tiles: Array<{
  //   url: string;
  //   x: number;
  //   y: number;
  // }> = [];

  // for (let i = 0; i < options.rows; i++) {
  //   let row = options.query.y + i;
  //   for (let j = 0; j < options.cols; j++) {
  //     let col = options.query.x + j;
  //     const query = { ...options.query, x: col, y: row };
  //     const url = `${REAL_EARTH_URL}/api/image?${stringify(query)}`;
  //     tiles.push({ url, x: j * 256, y: i * 256 });
  //     console.log(i, j, url, 256 * j, 256 * i);
  //   }
  // }
};

export const allTilesInfo$ = realEarthMeta$.pipe(
  switchMap(res => {
    res.times = res.times.slice(0, 1);
    console.log(res.times);
    return range(0, res.times.length).pipe(
      switchMap(index => {
        const options: FetchOptions = {
          rows: 6,
          cols: 5,
          query: {
            x: 161,
            y: 394,
            z: 10
          },
          time: res.times[index]
        };
        options.query.products = `${PRODUCT_NAME}_${res.times[index]
          .split(".")
          .join("_")}`;
        return tilesInfo$(options);
      })
    );
  })
);
