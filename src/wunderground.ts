import moment from "moment";
import { TelegrafContext } from "telegraf/typings/context";

export const wunderground = async (ctx: TelegrafContext, options: object) => {
  ctx.replyWithPhoto({
    url: `https://www.wunderground.com/cgi-bin/wxStationGraphAll?day=${moment().format("D")}&year=${moment().format(
      "Y"
    )}&month=${moment().format("M")}&ID=KCADALYC1&showpressure=1&type=3&width=500&showtemp=1&showwind=1&showwinddir=1`,
    filename: `KCADALYC1-${moment().format("M-D-Y")}.gif`,
  });
};
