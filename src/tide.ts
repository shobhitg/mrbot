import moment from "moment";
import { ContextMessageUpdate } from "telegraf";

//@ts-ignore
Date.prototype.yyyymmdd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth() + 1).toString(); // getMonth() is zero-based
  var dd = this.getDate().toString();

  return "" + yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]);
};

export const tide = async (ctx: ContextMessageUpdate, options: object) => {
  ctx.replyWithPhoto({
    //@ts-ignore
    url: `https://www.tideschart.com/tides/en/Pacifica-United-States-tides-chart-ft.png?date=${new Date().yyyymmdd()}`,
    filename: `Pacifica-tide-${moment().format("M-D-Y")}.gif`
  });
};
