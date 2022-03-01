const { Scenes, Composer, Markup, Telegraf } = require("telegraf");
const {
  getWalletById,
  listWallets,
  getWalletByName,
} = require("../../utils/loadAccount");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
  replyMenuMDV2,
} = require("../../utils/btnMenuHelpers");
const { AddressWallet } = require("cardano-wallet-js");

require("dotenv").config();
const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
/* 
Step 1
- Ask for telegram username
*/
const step1 = async (ctx) => {
  replyMenu(
    ctx,
    `Please enter the telegram username of the user you want to send to`
  );
  return ctx.wizard.next();
};

/* 
Step 2
- Check if user is in your wallet database
  - If in database
    - Ask for amount to send
  - If not in database
    - Show message 'This user is not registered in our wallet bot'

*/
let receiverAddress;
const step2 = new Composer();
step2.on("text", async (ctx) => {
  let username = ctx.message.text;
  username = username.match(/^(@)(.*)/)
    ? username.match(/^@(.*)/)[1]
    : username; //if there is an @ in front, remove it.

  let chats = (await listWallets())
    .map((wallet) => wallet.name)
    .map((chat_id) => bot.telegram.getChat(chat_id));
  try {
    chats = await Promise.all(chats);
    console.log({ chats });
    const toSendChat = chats.find((chat) => chat.username === username);
    if (!toSendChat) {
      throw {
        response: {
          data: { message: "Username doesn't exist in my database" },
        },
      };
    }
    const toSendId = (await toSendChat).id;
    const walletToSendTo = await getWalletByName(String(toSendId));
    const addresses = await walletToSendTo.getUnusedAddresses();
    receiverAddress = addresses.slice(0, 1)[0];
    await replyMenuHTML(
      ctx,
      `Username <a href="tg://user?id=${toSendId}">@${username}</a> was found in our database.\nPlease enter the amount to send (in ada)`
    );
    return ctx.wizard.next();
  } catch (e) {
    await replyMenuHTML(ctx, `🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
    await replyMenu(
      ctx,
      `Let's try again. Please enter the telegram username of the user you want to send to`
    );
    return;
  }
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
  console.log(receiverAddress);
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
      `${e.response.data.message}\n\nLet's try again. Please enter the telegram username of the user you want to send to`
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

const sendToTelegramScene = new Scenes.WizardScene(
  "sendToTelegramScene",
  step1,
  step2,
  step3,
  step4,
  step5
);

module.exports = { sendToTelegramScene };
