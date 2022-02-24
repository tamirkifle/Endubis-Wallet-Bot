const { Markup } = require("telegraf");

const replyMenuMDV2 = (ctx, mdMessage) => {
  return ctx.replyWithMarkdownV2(
    mdMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
};
const replyMenu = (ctx, mdMessage) => {
  return ctx.reply(
    mdMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
};

const replyMenuHTML = (ctx, mdMessage) => {
  return ctx.replyWithHTML(
    mdMessage,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
};
module.exports = { replyMenu, replyMenuMDV2, replyMenuHTML };
