const { Markup } = require("telegraf");

const mainMenuButton = (btnText = "Main Menu") => {
  return Markup.button.callback(btnText, "back-to-menu");
};

const replyMenuMDV2 = (ctx, mdMessage) => {
  return ctx.replyWithMarkdownV2(
    mdMessage,
    Markup.inlineKeyboard([[mainMenuButton()]])
  );
};
const replyMenu = (ctx, mdMessage) => {
  return ctx.reply(mdMessage, Markup.inlineKeyboard([[mainMenuButton()]]));
};

const replyMenuHTML = (ctx, mdMessage) => {
  return ctx.replyWithHTML(
    mdMessage,
    Markup.inlineKeyboard([[mainMenuButton()]])
  );
};
module.exports = {
  replyMenu,
  replyMenuMDV2,
  replyMenuHTML,
  mainMenuButton,
};
