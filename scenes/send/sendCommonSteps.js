const { Composer, Markup } = require("telegraf");
const { getWalletById, makeShelleyWallet } = require("../../utils/walletUtils");
const { replyMenu, mainMenuButton } = require("../../utils/btnMenuHelpers");
const { formatTxnData } = require("../../utils/formatTxnData");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { AddressWallet } = require("cardano-wallet-js");
const {
  buildTransaction,
} = require("../../utils/newWalletUtils/newWalletUtils");

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
    let { amount, receiverAddress } = ctx.scene.state;
    receiverAddress = new AddressWallet(receiverAddress.id);

    if (!amount) {
      replyMenu(
        ctx,
        "Invalid Entry, Try again.\n\nPlease enter the amount to send (in ada)"
      );
      return;
    }
    let wallet = await getWalletById(ctx.session.loggedInWalletId);
    ctx.scene.state.wallet = JSON.parse(JSON.stringify(wallet));
    try {
      const estimatedFees = await wallet.estimateFee(
        [receiverAddress],
        [amount]
      );
      // let coins = await wallet.getCoinSelection([receiverAddress], [amount]);
      // console.log(coins.inputs, coins.outputs, coins.change);
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
- Build Transaction and send to URL
*/

  const step4 = new Composer();
  step4.action("proceed-txn", async (ctx) => {
    let { amount, receiverAddress, wallet } = ctx.scene.state;
    receiverAddress = new AddressWallet(receiverAddress.id);
    wallet = makeShelleyWallet(ctx.scene.state.wallet);
    const txBuild = await buildTransaction(wallet, amount, receiverAddress);
    console.log(txBuild);
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
    let wallet = makeShelleyWallet(ctx.scene.state.wallet);

    let { amount, receiverAddress } = ctx.scene.state;
    receiverAddress = new AddressWallet(receiverAddress.id);

    try {
      ctx.scene.state.transaction = JSON.parse(
        JSON.stringify(
          await wallet.sendPayment(passphrase, [receiverAddress], [amount])
        )
      );
      const { transaction } = ctx.scene.state;
      ctx.replyWithHTML(
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
    let wallet = makeShelleyWallet(ctx.scene.state.wallet);
    ctx.scene.state.transaction = JSON.parse(
      JSON.stringify(
        await wallet.getTransaction(ctx.scene.state.transaction.id)
      )
    ); //refresh txn
    const { transaction } = ctx.scene.state;
    try {
      await ctx.deleteMessage();
    } catch (error) {
      console.log(error);
    }
    if (transaction.status === "in_ledger") {
      await ctx.replyWithHTML(
        `Transaction Details:\n${formatTxnData(transaction)}`,
        Markup.inlineKeyboard([[mainMenuButton()]])
      );
      return ctx.scene.leave();
    }
    await ctx.replyWithHTML(
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
