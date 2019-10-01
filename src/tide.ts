import moment from "moment";
import { ContextMessageUpdate } from "telegraf";

export const tide = async (ctx: ContextMessageUpdate, options: object) => {
  ctx.replyWithPhoto({
    url:
      "https://www.tideschart.com/tides/en/Pacifica-United-States-tides-chart-ft.png",
    filename: `Pacifica-tide-${moment().format("M-D-Y")}.gif`
  });
};
