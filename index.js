require("dotenv").config();
const { Telegraf } = require("telegraf");

const bot = new Telegraf(process.env.TG_BOT_API || "");

bot.on("text", (ctx) => {
  ctx.reply("Thank for writing to me");
});

bot.launch();
