import { Canvas } from "canvas";
import fs from "fs";
import moment from "moment";
import { map } from "rxjs/operators";
import { loadImage$ } from "./utils";

export const fortOrdProfiler$ = loadImage$(
  "https://met.nps.edu/~lind/profiler/ord_mix.gif"
).pipe(
  map(img => {
    const canvas: Canvas = new Canvas(648, 518);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const drawStroked = (text: string, x: number, y: number) => {
      ctx.font = "25px Monaco";
      ctx.shadowColor = "rgba(255,255,255,0.6)";
      ctx.shadowBlur = 9;
      ctx.lineWidth = 4;
      ctx.strokeText(text, x, y);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "black";
      ctx.fillStyle = "white";
      ctx.fillText(text, x, y);
    };
    const dateTimeString = moment().format("M-D-Y-hh-mm");
    drawStroked(dateTimeString, 315, 60);
    return canvas.toDataURL("image/png");
  })
);

export const saveFortOrdProfilerImageToDisk = (base64Img: string) => {
  const fileName: string = `./images/profiler_${moment().format(
    "M-D-Y-hh-mm"
  )}.gif`;
  fs.writeFileSync(
    fileName,
    base64Img.replace(/^data:image\/png;base64,/, ""),
    "base64"
  );
};
