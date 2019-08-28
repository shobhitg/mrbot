// import jimp from 'jimp';
import { stringify } from "querystring";
import mergeImages from "merge-images";
// import { ajax } from "rxjs/ajax";
// import { map } from "rxjs/operators";
// import { forkJoin } from 'rxjs';
import { Canvas, Image } from "canvas";
import { FetchOptions, REAL_EARTH_URL } from "./api";
// @ts-ignore
Canvas.Image = Image;


export const fetchTiles: (options: FetchOptions) => Promise<string> = async (
  options: FetchOptions
) => {
  const tiles: Array<{
    url: string;
    x: number;
    y: number;
  }> = [];

  for (let i = 0; i < options.rows; i++) {
    let row = options.query.y + i;
    for (let j = 0; j < options.cols; j++) {
      let col = options.query.x + j;
      const query = { ...options.query, x: col, y: row };
      const url = `${REAL_EARTH_URL}/api/image?${stringify(query)}`;
      tiles.push({ url, x: j * 256, y: i * 256 });
      console.log(i, j, url, 256 * j, 256 * i);
    }
  }

  const base64Image = mergeImages(
    tiles.map(data => {
      return { src: data.url, x: data.x, y: data.y };
    }),
    {
      Canvas,
      width: 256 * options.cols,
      height: 256 * options.rows,
      quality: 1.0
    }
  ).catch(() => fetchTiles(options));
  return base64Image;
};
