import { Image } from "canvas";
import { Subject } from "rxjs";

export const loadImage$ = (url: string) => {
  var img = new Image();
  img.src = url;
  var o = new Subject<Image>();
  img.onload = function() {
    o.next(img);
    console.log("completed");
    o.complete();
  };
  img.onerror = function(e) {
    o.error(e);
  }; // no fromEvent for err handling
  return o;
};
