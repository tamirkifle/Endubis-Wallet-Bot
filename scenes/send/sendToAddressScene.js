const { Scenes, Composer, Markup } = require("telegraf");
const { getWalletById } = require("../../utils/loadAccount");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
  replyMenuMDV2,
} = require("../../utils/btnMenuHelpers");
const { AddressWallet } = require("cardano-wallet-js");
/* 
Step 1
- Ask for address
*/
const step1 = async (ctx) => {
  replyMenu(ctx, `Please enter the address you want to send to`);
  return ctx.wizard.next();
};

/* 
Step 2
- TODO: Validate address
- Ask for amount to send

*/
let receiverAddress;
const step2 = new Composer();
step2.on("text", async (ctx) => {
  //TODO: Validate address
  console.log("here");
  const addrToSendTo = ctx.update.message?.text;
  receiverAddress = new AddressWallet(addrToSendTo);
  replyMenu(ctx, "Please enter the amount to send (in ada)");
  return ctx.wizard.next();
});

/* 
Step 3
- Calculate fee
- Ask for amount to send
- Show fee and other data 
- Show Send button
*/
let wallet, amount;
const step3 = new Composer();
step3.on("text", async (ctx) => {
  amount = Number(ctx.update.message?.text) * 1000000; //to lovelace
  if (!amount) {
    replyMenu(
      ctx,
      "Invalid Entry, Try again.\n\nPlease enter the amount to send (in ada)"
    );
    return;
  }
  wallet = await getWalletById(ctx.session?.loggedInWalletId);
  try {
    const estimatedFees = await wallet.estimateFee([receiverAddress], [amount]);
    if (estimatedFees) {
      ctx.reply(
        `Your Available balance: ${
          wallet.balance.available.quantity / 1000000
        } ada 
Amount to Send: ${amount / 1000000} ada
Receiving Address: ${receiverAddress.id}
Est. Fees: ${estimatedFees.estimated_min.quantity / 1000000} ada - ${
          estimatedFees.estimated_max.quantity / 1000000
        } ada`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Send", "send-txn")],
          [mainMenuButton()],
        ])
      );
    }
  } catch (e) {
    replyMenu(
      ctx,
      `${e.response.data.message}\n\nLet's try again. Please enter the address to send to`
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
step4.action("send-txn", async (ctx) => {
  replyMenu(ctx, `Please enter your passphrase`);
  return ctx.wizard.next();
});

/* 
Step 5
- Submit Transaction
*/

const step5 = new Composer();
step5.on("text", async (ctx) => {
  const passphrase = ctx.update.message?.text;
  try {
    let transaction = await wallet.sendPayment(
      passphrase,
      [receiverAddress],
      [amount]
    );
    ctx.reply(
      `Transaction Successfully Submitted.
Transaction Details: 
Txn ID: ${transaction.id}
Txn Amount: ${transaction.amount.quantity / 1000000} ada
Txn Fee: ${transaction.fee.quantity / 1000000} ada
Submitted at: ${String(new Date(transaction.pending_since.time))}
Status: ${transaction.status}

`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Refresh", "refresh-txn")],
        [mainMenuButton()],
      ])
    );
  } catch (e) {
    replyMenu(
      ctx,
      `${e.response.data.message}\n\nLet's try again. Please enter the address to send to`
    );
    return ctx.wizard.selectStep(1);
  }
});

const sendToAddressScene = new Scenes.WizardScene(
  "sendToAddressScene",
  step1,
  step2,
  step3,
  step4,
  step5
);

module.exports = { sendToAddressScene };
