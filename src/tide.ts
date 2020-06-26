import moment from "moment";
import { TelegrafContext } from "telegraf/typings/context";

const yyyymmdd = (date: Date) => {
  var yyyy = date.getFullYear().toString();
  var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
  var dd = date.getDate().toString();
  return "" + yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]);
};

export const tide = async (ctx: TelegrafContext, options: object) => {
  ctx.replyWithPhoto({
    url: `https://www.tideschart.com/tides/en/Pacifica-United-States-tides-chart-ft.png?date=${yyyymmdd(new Date())}`,
    filename: `Pacifica-tide-${moment().format("M-D-Y")}.gif`,
  });
};
