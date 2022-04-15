const { Scenes } = require("telegraf");
// const LocalSession = require("telegraf-session-local");
// const CryptoJS = require("crypto-js");

const { firestoreMiddlewareFn } = require("./firestoreInit");
const { telegrafThrottler } = require("telegraf-throttler");

const { createAccountScene } = require("./scenes/createAccountScene");
const { restoreAccountScene } = require("./scenes/restoreAccountScene");
const { receiveScene } = require("./scenes/receiveScene");
const { depositScene } = require("./scenes/depositScene");
const { manageAccountScene } = require("./scenes/manageAccountScene");
const {
  changePassphraseScene,
} = require("./scenes/manageAccount/changePassphraseScene");
const {
  deleteWalletScene,
} = require("./scenes/manageAccount/deleteWalletScene");
const { mainMenuHandler } = require("./handlers/mainMenuHandler");
const { walletBalanceHandler } = require("./handlers/walletBalanceHandler");
const { viewTransactionsScene } = require("./scenes/viewTransactionsScene");
const { sendScene } = require("./scenes/sendScene");
const { sendToAddressScene } = require("./scenes/send/sendToAddressScene");
const { sendToTelegramScene } = require("./scenes/send/sendToTelegramScene");
const {
  sHandler,
  generalInlineHandler,
  generalWithAmountHandler,
  qrHandler,
  addrHandler,
} = require("./handlers/inlineQueryHandlers");
const { startPayloadHandler } = require("./handlers/startPayloadHandler");
const { sendToUserIdScene } = require("./scenes/send/sendToUserIdScene");

const bot = require("./botSession");

const throttler = telegrafThrottler();
bot.use(throttler);
const stage = new Scenes.Stage([
  createAccountScene,
  restoreAccountScene,
  receiveScene,
  depositScene,
  sendScene,
  viewTransactionsScene,
  manageAccountScene,
  changePassphraseScene,
  deleteWalletScene,
  sendToAddressScene,
  sendToTelegramScene,
  sendToUserIdScene,
]);
// const localSession = new LocalSession({
//   database: "wallet_bot_db",
//   format: {
//     serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
//     deserialize: (str) => JSON.parse(str),
//   },
// });
// bot.use(localSession.middleware());

bot.use(firestoreMiddlewareFn);

bot.use(stage.middleware());

bot.on("inline_query", (ctx, next) => {
  if (!ctx.session.loggedInWalletId) {
    ctx.answerInlineQuery([], {
      switch_pm_text: "Start using Endubis Wallet",
      switch_pm_parameter: "go-to-wallet",
    });
  } else {
    next();
  }
});
bot.inlineQuery("s", sHandler);
bot.inlineQuery("qr", qrHandler);
bot.inlineQuery("add", addrHandler);
bot.inlineQuery(/(\d+.?\d*)/, generalWithAmountHandler);

bot.on("inline_query", generalInlineHandler);

bot.start(startPayloadHandler, mainMenuHandler);
bot.hears("🏠 Main Menu", mainMenuHandler);

bot.action("create-wallet", Scenes.Stage.enter("createAccountScene"));
bot.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));
bot.action(["wallet-balance", "refresh-balance"], walletBalanceHandler);
bot.action("receive", Scenes.Stage.enter("receiveScene"));
bot.action(["send", "refresh-send"], Scenes.Stage.enter("sendScene"));
bot.action("deposit", Scenes.Stage.enter("depositScene"));
bot.action("manage-account", Scenes.Stage.enter("manageAccountScene"));
bot.action("view-transactions", Scenes.Stage.enter("viewTransactionsScene"));
bot.action("log-out", async (ctx) => {
  ctx.session.loggedInWalletId = null;
  ctx.session.userInfo = null;
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log(error);
  }
  mainMenuHandler(ctx);
});

//Handles all Back to Menu clicks outside scenes
bot.action("back-to-menu", mainMenuHandler);

//THis will only activate if called outside the scene: createAccountScene, eg. if a user clicks an older message with the delete button
//So Just delete and don't try to restore the wallet
bot.action("delete-then-restore", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log(error);
  }
});

const getChat = (chat_id) => {
  return bot.telegram.getChat(chat_id);
};

bot.launch();

module.exports = { getChat };
