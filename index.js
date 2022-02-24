const { Telegraf, Markup, Scenes } = require("telegraf");
const LocalSession = require("telegraf-session-local");
const CryptoJS = require("crypto-js");

const { createAccountScene } = require("./scenes/createAccountScene");
const { restoreAccountScene } = require("./scenes/restoreAccountScene");
const { manageAccountScene } = require("./scenes/manageAccountScene");
const {
  changePassphraseScene,
} = require("./scenes/manageAccount/changePassphraseScene");
const {
  deleteWalletScene,
} = require("./scenes/manageAccount/deleteWalletScene");
const { mainMenuHandler } = require("./handlers/mainMenuHandler");
const { walletBalanceHandler } = require("./handlers/walletBalanceHandler");

require("dotenv").config();

const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const stage = new Scenes.Stage([
  createAccountScene,
  restoreAccountScene,
  manageAccountScene,
  changePassphraseScene,
  deleteWalletScene,
]);
bot.use(
  new LocalSession({
    database: "wallet_bot_db",
    format: {
      serialize: (obj) =>
        CryptoJS.AES.encrypt(
          JSON.stringify(obj, null, 2),
          process.env.SECRET_KEY || "secret key 123"
        ).toString(), // null & 2 for pretty-formatted JSON
      deserialize: (str) =>
        JSON.parse(
          CryptoJS.AES.decrypt(
            str,
            process.env.SECRET_KEY || "secret key 123"
          ).toString(CryptoJS.enc.Utf8)
        ),
    },
  })
);
bot.use(stage.middleware());

bot.start(mainMenuHandler);

bot.action("create-wallet", Scenes.Stage.enter("createAccountScene"));

bot.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));
bot.action("wallet-balance", walletBalanceHandler);
bot.action("manage-account", Scenes.Stage.enter("manageAccountScene"));
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

bot.launch();
