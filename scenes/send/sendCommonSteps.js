const { Composer, Markup } = require("telegraf");
const { getWalletById, makeShelleyWallet } = require("../../utils/walletUtils");
const { replyMenu, mainMenuButton } = require("../../utils/btnMenuHelpers");
const { formatTxnData } = require("../../utils/formatTxnData");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { ShelleyWallet } = require("cardano-wallet-js");

const sendCommonSteps = (errorMsg) => {
  /* 
Step 3
- Calculate fee
- Ask for amount to send
- Show fee and other data 
- Show Send button
*/
  const step3 = new Composer();
  step3.start(mainMenuHandler);
  step3.hears("🏠 Main Menu", mainMenuHandler);

  step3.on("text", async (ctx) => {
    ctx.scene.state.amount = Number(ctx.message?.text) * 1000000; //to lovelace
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
    } catch (e) {
      replyMenu(
        ctx,
        `${e.response.data.message}\n\nLet's try again. ${errorMsg}`
      );
      return ctx.wizard.back();
    }
    return ctx.wizard.next();
  });

  /* 
Step 4
- Ask for passphrase
*/

  const step4 = new Composer();
  step4.action("proceed-txn", async (ctx) => {
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

  const step5 = new Composer();
  step5.start(mainMenuHandler);
  step5.hears("🏠 Main Menu", mainMenuHandler);

  step5.on("text", async (ctx) => {
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
      replyMenu(
        ctx,
        `${e.response.data.message}\n\nLet's try again. ${errorMsg}`
      );
      return ctx.wizard.selectStep(1);
    }
  });

  const step6 = new Composer();
  step6.action("refresh-txn", async (ctx) => {
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
  return [step3, step4, step5, step6];
};
module.exports = { sendCommonSteps };
