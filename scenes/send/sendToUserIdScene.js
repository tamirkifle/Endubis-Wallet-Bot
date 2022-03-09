const { Scenes, Composer, Markup, Telegraf } = require("telegraf");
const { getWalletByName, getWalletById } = require("../../utils/loadAccount");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
} = require("../../utils/btnMenuHelpers");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { formatTxnData } = require("../../utils/formatTxnData");

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
  try {
    const toSendId = ctx.session?.toSendUserId;
    const walletToSendTo = await getWalletByName(String(toSendId));
    const addresses = await walletToSendTo.getUnusedAddresses();
    ctx.scene.state.receiverAddress = addresses.slice(0, 1)[0];
    const chat = await bot.telegram.getChat(toSendId);
    await replyMenuHTML(
      ctx,
      `User <a href="tg://user?id=${toSendId}">@${chat.username} (${chat.first_name} ${chat.last_name})</a> was found in our database.\nPlease enter the amount to send (in ada)`
    );
    return ctx.wizard.next();
  } catch (e) {
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${JSON.stringify(e)}`);
    return mainMenuHandler(ctx);
  }
};

const step2 = new Composer();
step2.start(mainMenuHandler);

step2.on("text", async (ctx) => {
  ctx.scene.state.amount = Number(ctx.update.message?.text) * 1000000; //to lovelace
  const { amount, receiverAddress } = ctx.scene.state;
  if (!amount) {
    replyMenu(
      ctx,
      "Invalid Entry, Try again.\n\nPlease enter the amount to send (in ada)"
    );
    return;
  }
  ctx.scene.state.wallet = await getWalletById(ctx.session?.loggedInWalletId);
  const { wallet } = ctx.scene.state;
  try {
    const estimatedFees = await wallet.estimateFee([receiverAddress], [amount]);
    if (estimatedFees) {
      ctx.reply(
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
    return ctx.wizard.next();
  } catch (e) {
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
    await replyMenu(
      ctx,
      `Let's try again. Please enter the amount to send (in ada)`
    );
  }
  return;
});

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

step4.on("text", async (ctx) => {
  const passphrase = ctx.update.message?.text;
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
      [Markup.button.callback("Refresh", "refresh-txn")],
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
