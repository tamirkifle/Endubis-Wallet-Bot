const { Scenes, Composer, Markup, Telegraf } = require("telegraf");
const {
  getWalletByName,
  getWalletById,
  makeShelleyWallet,
} = require("../../utils/loadAccount");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
} = require("../../utils/btnMenuHelpers");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { formatTxnData } = require("../../utils/formatTxnData");
const { ShelleyWallet } = require("cardano-wallet-js");

require("dotenv").config();
const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

/* 
Step 1
- Take userid from session and ask for amount
*/
const step1 = async (ctx) => {
  if (ctx.session.expiryTime && Date.now() > Number(ctx.session.expiryTime)) {
    //EXPIRED
    await replyMenu(ctx, "Sorry. The button you clicked has expired.");
    return ctx.scene.leave();
  } else if (ctx.session.expiryTime) {
    ctx.replyWithHTML(
      `<i><b>Note: Link expires in 00:${String(
        Math.floor((ctx.session.expiryTime - Date.now()) / 60000)
      ).padStart(2, 0)}:${String(
        Math.floor(
          ((ctx.session.expiryTime - Date.now()) / 60000 -
            Math.floor((ctx.session.expiryTime - Date.now()) / 60000)) *
            60
        )
      ).padStart(2, 0)}</b></i>`
    );
  }
  try {
    const toSendId = ctx.session.toSendUserId;
    const walletToSendTo = await getWalletByName(String(toSendId));
    const addresses = await walletToSendTo.getUnusedAddresses();
    ctx.scene.state.receiverAddress = addresses.slice(0, 1)[0];
    const userInfo = await bot.telegram.getChat(toSendId);
    if (ctx.session.amountToSend) {
      await ctx.replyWithHTML(
        `User <a href="tg://user?id=${toSendId}">${
          userInfo.username ? `@` + userInfo.username + ` - ` : ``
        }${userInfo.first_name}${
          userInfo.last_name ? ` ` + userInfo.last_name : ``
        }</a> was found in our database.`
      );
      ctx.scene.state.amount = ctx.session.amountToSend;
      amountHandler()(ctx);
      return;
    } else {
      await replyMenuHTML(
        ctx,
        `User <a href="tg://user?id=${toSendId}">${
          userInfo.username ? `@` + userInfo.username + ` - ` : ``
        }(${userInfo.first_name}${
          userInfo.last_name ? ` ` + userInfo.last_name : ``
        })</a> was found in our database.\nPlease enter the amount to send (in ada)`
      );
      return ctx.wizard.next();
    }
  } catch (e) {
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${JSON.stringify(e)}`);
    return mainMenuHandler(ctx);
  }
};

const step2 = new Composer();
step2.start(mainMenuHandler);
step2.hears("🏠 Main Menu", mainMenuHandler);

const amountHandler = () => {
  return async (ctx) => {
    if (Number(ctx.message?.text)) {
      ctx.scene.state.amount = Number(ctx.message?.text) * 1000000; //to lovelace;
    } else {
      ctx.scene.state.amount = Number(ctx.session.amountToSend) * 1000000; //to lovelace;
    }
    const { amount, receiverAddress } = ctx.scene.state;
    if (!amount) {
      replyMenu(
        ctx,
        "Invalid Entry, Try again.\n\nPlease enter the amount to send (in ada)"
      );
      return;
    }
    ctx.scene.state.wallet = await getWalletById(ctx.session.loggedInWalletId);
    const { wallet } = ctx.scene.state;
    try {
      const estimatedFees = await wallet.estimateFee(
        [receiverAddress],
        [amount]
      );
      if (estimatedFees) {
        await ctx.reply(
          `Your Available balance: ${
            wallet.balance.available.quantity / 1000000
          } ada 
Amount to Send: ${amount / 1000000} ada
Est. Fees: ${estimatedFees.estimated_min.quantity / 1000000} ada - ${
            estimatedFees.estimated_max.quantity / 1000000
          } ada`,
          Markup.inlineKeyboard([
            [Markup.button.callback("Proceed", "proceed-txn")],
            [mainMenuButton("Cancel")],
          ])
        );
      }
      if (ctx.session.amountToSend) {
        return ctx.wizard.selectStep(ctx.wizard.cursor + 2);
      }
      return ctx.wizard.next();
    } catch (e) {
      await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
      await replyMenu(
        ctx,
        `Let's try again. Please enter the amount to send (in ada)`
      );
      return;
    }
  };
};
step2.on("text", amountHandler());

/* 
Step 4
- Ask for passphrase
*/

const step3 = new Composer();
step3.action("proceed-txn", async (ctx) => {
  replyMenu(
    ctx,
    `Please enter your passphrase to sign and submit this transaction.`
  );
  return ctx.wizard.next();
});

/* 
Step 5
- Submit Transaction
*/

const step4 = new Composer();
step4.start(mainMenuHandler);
step4.hears("🏠 Main Menu", mainMenuHandler);

step4.on("text", async (ctx) => {
  const passphrase = ctx.message?.text;
  if (!(ctx.scene.state.wallet instanceof ShelleyWallet)) {
    ctx.scene.state.wallet = makeShelleyWallet(ctx.scene.state.wallet);
  }
  const { amount, receiverAddress, wallet } = ctx.scene.state;
  try {
    ctx.scene.state.transaction = await wallet.sendPayment(
      passphrase,
      [receiverAddress],
      [amount]
    );
    const { transaction } = ctx.scene.state;
    ctx.reply(
      `Transaction Successfully Submitted.
Transaction Details: 
${formatTxnData(transaction)}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Refresh", "refresh-txn")],
        [
          Markup.button.url(
            "More Details",
            `https://testnet.cardanoscan.io/transaction/${transaction.id}`
          ),
        ],
        [mainMenuButton()],
      ])
    );
    return ctx.wizard.next();
  } catch (e) {
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
    await replyMenu(
      ctx,
      `Let's try again. Please enter your passphrase to sign and submit this transaction.`
    );
    return;
  }
});

const step5 = new Composer();
step5.action("refresh-txn", async (ctx) => {
  if (!(ctx.scene.state.wallet instanceof ShelleyWallet)) {
    ctx.scene.state.wallet = makeShelleyWallet(ctx.scene.state.wallet);
  }
  const { wallet } = ctx.scene.state;
  ctx.scene.state.transaction = await wallet.getTransaction(
    ctx.scene.state.transaction.id
  ); //refresh txn
  const { transaction } = ctx.scene.state;
  await ctx.deleteMessage();
  if (transaction.status === "in_ledger") {
    await ctx.reply(
      `Transaction Details:\n${formatTxnData(transaction)}`,
      Markup.inlineKeyboard([[mainMenuButton()]])
    );
    return ctx.scene.leave();
  }
  await ctx.reply(
    `Transaction Details:\n${formatTxnData(transaction)}`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Refresh", "refresh-txn")],
      [
        Markup.button.url(
          "More Details",
          `https://testnet.cardanoscan.io/transaction/${transaction.id}`
        ),
      ],
      [mainMenuButton()],
    ])
  );
  return;
});

const sendToUserIdScene = new Scenes.WizardScene(
  "sendToUserIdScene",
  step1,
  step2,
  step3,
  step4,
  step5
);

module.exports = { sendToUserIdScene };
