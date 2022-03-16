const { Markup } = require("telegraf");

const mainMenuButton = (btnText = "Main Menu") => {
  return Markup.button.callback(btnText, "back-to-menu");
};

const replyMenuMDV2 = (ctx, mdMessage, otherOptions = {}) => {
  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton()],
    ];
  }
  return ctx.replyWithMarkdownV2(mdMessage, otherOptions);
};
const replyMenu = (ctx, mdMessage, otherOptions = {}) => {
  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton()],
    ];
  }
  return ctx.reply(mdMessage, otherOptions);
};

const replyMenuHTML = (ctx, mdMessage, otherOptions = {}) => {
  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton()],
    ];
  }
  return ctx.replyWithHTML(mdMessage, otherOptions);
};
const replyMenuPhoto = (ctx, photo, otherOptions = {}) => {
  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton()],
    ];
  }
  return ctx.replyWithPhoto(photo, otherOptions);
};
module.exports = {
  replyMenu,
  replyMenuMDV2,
  replyMenuHTML,
  replyMenuPhoto,
  mainMenuButton,
};
