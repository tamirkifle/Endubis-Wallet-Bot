const { Telegraf, Markup, Scenes } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const CryptoJS = require("crypto-js");
const { telegrafThrottler } = require("telegraf-throttler");

const { createAccountScene } = require("./scenes/createAccountScene");
const { restoreAccountScene } = require("./scenes/restoreAccountScene");
const { receiveScene } = require("./scenes/receiveScene");
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
} = require("./handlers/inlineQueryHandlers");
const { startPayloadHandler } = require("./handlers/startPayloadHandler");
const { sendToUserIdScene } = require("./scenes/send/sendToUserIdScene");

require("dotenv").config();

const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
const throttler = telegrafThrottler();
bot.use(throttler);
const stage = new Scenes.Stage([
  createAccountScene,
  restoreAccountScene,
  receiveScene,
  sendScene,
  viewTransactionsScene,
  manageAccountScene,
  changePassphraseScene,
  deleteWalletScene,
  sendToAddressScene,
  sendToTelegramScene,
  sendToUserIdScene,
]);
const localSession = new LocalSession({
  database: "wallet_bot_db",
  format: {
    serialize: (obj) => JSON.stringify(obj, null, 2), // null & 2 for pretty-formatted JSON
    deserialize: (str) => JSON.parse(str),
  },
});
bot.use(localSession.middleware());
bot.use(stage.middleware());

bot.inlineQuery("s", sHandler);
bot.inlineQuery(/(\d+.?\d+)/, generalWithAmountHandler);

bot.on("inline_query", generalInlineHandler);

bot.start(startPayloadHandler, mainMenuHandler);
// bot.start(mainMenuHandler);
bot.action("create-wallet", Scenes.Stage.enter("createAccountScene"));

bot.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));
bot.action(["wallet-balance", "refresh-balance"], walletBalanceHandler);
bot.action("receive", Scenes.Stage.enter("receiveScene"));
bot.action("send", Scenes.Stage.enter("sendScene"));
bot.action("manage-account", Scenes.Stage.enter("manageAccountScene"));
bot.action("view-transactions", Scenes.Stage.enter("viewTransactionsScene"));
bot.action("log-out", (ctx) => {
  ctx.session.loggedInWalletId = null;
  ctx.deleteMessage();
  mainMenuHandler(ctx);
});

//Handles all Back to Menu clicks outside scenes
bot.action("back-to-menu", mainMenuHandler);

//THis will only activate if called outside the scene: createAccountScene, eg. if auser clicks an older message with the delete button
//So Just delete and don't try to restore the wallet
bot.action("delete-then-restore", (ctx) => {
  ctx.deleteMessage();
});

const getChat = (chat_id) => {
  return bot.telegram.getChat(chat_id);
};

bot.launch();

module.exports = { getChat };
