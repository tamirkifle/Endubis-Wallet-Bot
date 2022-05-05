const { Composer, Markup } = require("telegraf");
const {
  getWalletById,
  makeShelleyWallet,
  getTransaction,
} = require("../../utils/walletUtils");
const { replyMenu, mainMenuButton } = require("../../utils/btnMenuHelpers");
const { formatTxnData } = require("../../utils/formatTxnData");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { AddressWallet } = require("cardano-wallet-js");
const {
  buildTransaction,
} = require("../../utils/newWalletUtils/newWalletUtils");
const { clientBaseUrl } = require("../../utils/urls");
const { getSessionKey } = require("../../firestoreInit");

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
    let wallet = await getWalletById(ctx.session.xpubWalletId);
    ctx.scene.state.wallet = JSON.parse(JSON.stringify(wallet));
    try {
      const { transaction: txBuild, coinSelection } = await buildTransaction(
        wallet,
        amount,
        receiverAddress
      );
      ctx.session.unsignedTx = {
        unsignedTxHex: Buffer.from(txBuild.to_bytes()).toString("hex"),
        time: Date.now(),
        balance: wallet.balance.available.quantity,
        amount,
        fee: txBuild.fee().to_str(),
        coinSelection: JSON.parse(JSON.stringify(coinSelection)),
      };
      const send = `${clientBaseUrl}/send?sessionKey=${getSessionKey(ctx)}`;
      await ctx.reply(
        `Your Available balance: ${
          wallet.balance.available.quantity / 1000000
        } ada
Amount to Send: ${amount / 1000000} ada
Est. Fees: ${txBuild.fee().to_str() / 1000000} ada`,
        Markup.inlineKeyboard([
          [Markup.button.url("Continue", `${send}`)],
          [mainMenuButton("Cancel")],
        ])
      );
    } catch (e) {
      replyMenu(
        ctx,
        `${
          e.response?.data?.message || e.message
        }\n\nLet's try again. ${errorMsg}`
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
  step4.action(["txnid", "refresh-txn"], async (ctx) => {
    if (ctx.callbackQuery.data === "refresh-txn") {
      try {
        await ctx.deleteMessage();
      } catch (error) {
        console.log(error);
      }
    }
    const sessionData = ctx.session;
    let wallet = sessionData.__scenes.state.wallet;
    wallet = makeShelleyWallet(wallet);
    try {
      const transaction = await getTransaction(
        wallet,
        sessionData.transactionId
      );
      if (transaction.status === "in_ledger") {
        await ctx.replyWithHTML(
          `Transaction Details:\n${formatTxnData(transaction)}`,
          Markup.inlineKeyboard([[mainMenuButton()]])
        );
        return ctx.scene.leave();
      }
      ctx.replyWithHTML(
        `Transaction Details: 
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
    } catch (e) {
      if (e.response?.data?.code === "no_such_transaction") {
        await ctx.replyWithHTML(
          `Transaction Details: 
Transaction ID: ${sessionData.transactionId}
Status: Pending`,
          Markup.inlineKeyboard([
            [Markup.button.callback("Refresh", "refresh-txn")],
            [
              Markup.button.url(
                "More Details",
                `https://testnet.cardanoscan.io/transaction/${sessionData.transactionId}`
              ),
            ],
            [mainMenuButton()],
          ])
        );
      }
    }
  });

  return [step3, step4];
};
module.exports = { sendCommonSteps };
