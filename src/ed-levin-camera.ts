import { Canvas } from "canvas";
import fs from "fs";
import path from "path";
import moment from "moment";
import { map } from "rxjs/operators";
import { loadImage$ } from "./utils";
import { spawnSync } from "child_process";
import { ContextMessageUpdate } from "telegraf";

export const fetchEdLevinCameraImage$ = () =>
  loadImage$(`http://windslammer.hang-gliding.com/WindSlammer/snap.jpg?${new Date().getTime()}`).pipe(
    map(img => {
      const canvas: Canvas = new Canvas(320, 180);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const drawStroked = (text: string, x: number, y: number) => {
        ctx.font = "18px Monaco";
        ctx.shadowColor = "rgba(255,255,255,0.5)";
        ctx.shadowBlur = 3;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "black";
        ctx.strokeText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.fillStyle = "white";
        ctx.fillText(text, x, y);
      };
      const dateTimeString = moment().format("M-D-Y-hh-mm-ss");
      drawStroked(dateTimeString, 60, 25);
      return canvas.toDataURL("image/jpeg");
    })
  );

enum sizeType {
  BIG,
  SMALL
}

const folderName = (size: sizeType) => `ed-levin-${size === sizeType.SMALL ? "small" : "big"}`;

const fileNamePrefix = (size: sizeType) => `ed-levin-${size === sizeType.SMALL ? "small" : "big"}-snap-`;

export const saveEdLevinCameraImageImageToDisk = (base64Img: string) => {
  const fileName: string = `./images/${folderName(sizeType.SMALL)}/${fileNamePrefix(sizeType.SMALL)}${moment().format(
    "M-D-Y-hh-mm-ss"
  )}.jpg`;
  fs.writeFileSync(fileName, base64Img.replace(/^data:image\/jpeg;base64,/, ""), "base64");
};

export const respondWithEdLevinCameraAnimation = (ctx: ContextMessageUpdate) => {
  console.log("/ws invoked");

  const dir = `./images/${folderName(sizeType.SMALL)}`;
  const images = fs
    .readdirSync(dir, { withFileTypes: true })

    .filter(item => item.isFile())
    .filter(item => item.name.startsWith(fileNamePrefix(sizeType.SMALL)))
    .map(file => {
      return {
        name: file.name,
        time: fs.statSync(path.join(dir, file.name)).ctime
      };
    })
    .sort((a, b) => a.time.getTime() - b.time.getTime())

    .map(item => item.name);

  // if (!animate) {
  //   ctx.replyWithPhoto({
  //     source: fs.readFileSync("./images/" + images[images.length - 1].replace(".png", ".webp"))
  //   });
  //   return;
  // }

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
      .map(name => `./images/${folderName(sizeType.SMALL)}/${name}`)
      .map(image => ["-delay", "0", image])
  );

  console.log(args);
  spawnSync(`convert`, [
    ...args,
    "-delay",
    "200",
    images
      .slice(-1)
      .map(name => `./images/${folderName(sizeType.SMALL)}/${name}`)
      .join(" "),
    "-loop",
    "0",
    `./images/${folderName(sizeType.SMALL)}/animation-ed-levin.gif`
  ]);
  // convert -delay 0 images/G* -delay 50 images/G17-ABI-CONUS-BAND02_20190830_165119.webp -loop 0 out.gif

  ctx.replyWithDocument({
    source: fs.readFileSync(`./images/${folderName(sizeType.SMALL)}/animation-ed-levin.gif`),
    filename: `animation-ed-levin.gif`
  });
};
