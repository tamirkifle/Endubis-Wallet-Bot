const { Scenes } = require("telegraf");
// const CryptoJS = require("crypto-js");

const { firestoreMiddlewareFn } = require("./firestoreInit");
const { telegrafThrottler } = require("telegraf-throttler");

const { receiveScene } = require("./scenes/receiveScene");
const { depositScene } = require("./scenes/depositScene");
const { manageAccountScene } = require("./scenes/manageAccountScene");

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
const { replyMenu } = require("./utils/btnMenuHelpers");
const { createCardanoWallet } = require("./utils/newWalletUtils");
const logoutHandler = require("./handlers/logoutHandler");
const { getSessionData } = require("./utils/firestore");
const {
  deletePastMessagesHandler,
} = require("./handlers/deleteMessageHandler");

const throttler = telegrafThrottler();
bot.use(throttler);
const stage = new Scenes.Stage([
  receiveScene,
  depositScene,
  sendScene,
  viewTransactionsScene,
  manageAccountScene,
  deleteWalletScene,
  sendToAddressScene,
  sendToTelegramScene,
  sendToUserIdScene,
]);

bot.use(firestoreMiddlewareFn);
bot.use(deletePastMessagesHandler);
bot.start(startPayloadHandler, mainMenuHandler);
bot.hears("🏠 Main Menu", mainMenuHandler);
bot.action("back-to-menu", mainMenuHandler);
bot.use(stage.middleware());

bot.use(async (ctx, next) => {
  const sessionData = ctx.session;
  if (sessionData?.loggedInXpub && !sessionData?.xpubWalletId) {
    const wallet = await createCardanoWallet(
      sessionData.loggedInXpub,
      String(ctx.from.id)
    );
    if (wallet) {
      ctx.session.xpubWalletId = wallet.id;
    }
  }
  return next();
});

bot.on("callback_query", async (ctx, next) => {
  try {
    if (
      !ctx.session.loggedInXpub &&
      ctx.callbackQuery?.data !== "back-to-menu"
    ) {
      await replyMenu(
        ctx,
        "You are not logged in. Go to the Main Menu to Log In"
      );
      return ctx.answerCbQuery();
    }
    // ctx.answerCbQuery(undefined, { cache_time: 5 });
  } catch (e) {
    console.log(e);
  }
  return next();
});
bot.on("inline_query", async (ctx, next) => {
  const sessionData = await getSessionData(ctx);
  ctx.session = sessionData;
  if (!sessionData?.loggedInXpub) {
    ctx.answerInlineQuery([], {
      switch_pm_text: "Start using Endubis Wallet",
      switch_pm_parameter: "go-to-wallet",
      cache_time: 0,
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

bot.action(["wallet-balance", "refresh-balance"], walletBalanceHandler);
bot.action("receive", Scenes.Stage.enter("receiveScene"));
bot.action(["send", "refresh-send"], Scenes.Stage.enter("sendScene"));
bot.action("deposit", Scenes.Stage.enter("depositScene"));
bot.action("manage-account", Scenes.Stage.enter("manageAccountScene"));
bot.action("view-transactions", Scenes.Stage.enter("viewTransactionsScene"));
bot.action("log-out", logoutHandler);

// bot.telegram.setWebhook("https://endubiswallet.tk/bot");

// bot.startWebhook("/bot", null, 5000);

bot.launch();
