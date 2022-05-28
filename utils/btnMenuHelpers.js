const { Markup } = require("telegraf");
const { getSessionKey } = require("../firestoreInit");
const { writeToSession } = require("./firestore");

const mainMenuButton = (btnText = "Main Menu") => {
  return Markup.button.callback(btnText, "back-to-menu");
};

const replyText = async (ctx, text, otherOptions = {}) => {
  const res = await ctx.reply(text, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};

const replyHTML = async (ctx, html, otherOptions = {}) => {
  const res = await ctx.replyWithHTML(html, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};
const replyMenuMDV2 = async (ctx, mdMessage, otherOptions = {}) => {
  const menuText = otherOptions?.menuText || "Main Menu";

  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton(menuText)],
    ];
  } else {
    otherOptions.reply_markup.inline_keyboard = [[mainMenuButton(menuText)]];
  }
  const res = await ctx.replyWithMarkdownV2(mdMessage, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};
const replyMenu = async (ctx, mdMessage, otherOptions = {}) => {
  const menuText = otherOptions?.menuText || "Main Menu";

  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton(menuText)],
    ];
  } else {
    otherOptions.reply_markup.inline_keyboard = [[mainMenuButton(menuText)]];
  }
  const res = await ctx.reply(mdMessage, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};

const replyMenuHTML = async (ctx, mdMessage, otherOptions = {}) => {
  const menuText = otherOptions?.menuText || "Main Menu";

  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton(menuText)],
    ];
  } else {
    otherOptions.reply_markup.inline_keyboard = [[mainMenuButton(menuText)]];
  }
  const res = await ctx.replyWithHTML(mdMessage, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};
const replyMenuPhoto = async (ctx, photo, otherOptions = {}) => {
  const menuText = otherOptions?.menuText || "Main Menu";

  if (!otherOptions.reply_markup) {
    otherOptions.reply_markup = {};
  }
  if (otherOptions.reply_markup.inline_keyboard) {
    otherOptions.reply_markup.inline_keyboard = [
      ...otherOptions.reply_markup.inline_keyboard,
      [mainMenuButton(menuText)],
    ];
  } else {
    otherOptions.reply_markup.inline_keyboard = [[mainMenuButton(menuText)]];
  }
  const res = await ctx.replyWithPhoto(photo, otherOptions);
  let deleteAfter = true;
  if (otherOptions.deleteAfter) {
    deleteAfter = otherOptions.deleteAfter;
  }
  if (deleteAfter && res?.message_id) {
    ctx.session.messageIdsToDelete = [
      ...(ctx.session.messageIdsToDelete || []),
      res.message_id,
    ];
    await writeToSession(
      getSessionKey(ctx),
      "messageIdsToDelete",
      ctx.session.messageIdsToDelete
    );
  }
  return res;
};
module.exports = {
  replyMenu,
  replyMenuMDV2,
  replyMenuHTML,
  replyMenuPhoto,
  mainMenuButton,
  replyText,
  replyHTML,
};
