const { Scenes, Composer, Markup } = require("telegraf");
const {
  getWalletByName,
  getWalletById,
  makeShelleyWallet,
  isWalletServerActive,
} = require("../../utils/walletUtils");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
  replyHTML,
} = require("../../utils/btnMenuHelpers");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { formatTxnData } = require("../../utils/formatTxnData");
const { AddressWallet } = require("cardano-wallet-js");
const { buildTransaction } = require("../../utils/newWalletUtils");
const { clientBaseUrl } = require("../../utils/urls");
const { getSessionKey } = require("../../firestoreInit");
const { writeToSession } = require("../../utils/firestore");
const bot = require("../../botSession");

/* 
Step 1
- Take userid from session and ask for amount
*/
const step1 = async (ctx) => {
  if (!(await isWalletServerActive())) {
    await replyMenu(
      ctx,
      "Server is not ready. Please try again in a few minutes.\nContact support if the issue persists."
    );
    return ctx.scene.leave();
  }
  if (ctx.session.expiryTime && Date.now() > Number(ctx.session.expiryTime)) {
    //EXPIRED
    await replyMenu(ctx, "Sorry. The button you clicked has expired.");
    return ctx.scene.leave();
  } else if (ctx.session.expiryTime) {
    replyHTML(
      ctx,
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
    ctx.scene.state.receiverAddress = JSON.parse(
      JSON.stringify(addresses.slice(0, 1)[0])
    );
    const userInfo = await bot.telegram.getChat(toSendId);
    if (ctx.session.amountToSend) {
      await replyHTML(
        ctx,
        `User <a href="tg://user?id=${toSendId}"><b>${
          userInfo.username ? `@` + userInfo.username + ` - ` : ``
        }${userInfo.first_name}${
          userInfo.last_name ? ` ` + userInfo.last_name : ``
        }</b></a> was found in our database.`
      );
      ctx.scene.state.amount = ctx.session.amountToSend;
      amountHandler()(ctx);
      return;
    } else {
      await replyMenuHTML(
        ctx,
        `User <a href="tg://user?id=${toSendId}"><b>${
          userInfo.username ? `@` + userInfo.username + ` - ` : ``
        }(${userInfo.first_name}${
          userInfo.last_name ? ` ` + userInfo.last_name : ``
        })</b></a> was found in our database.\nPlease enter the amount to send (in ada)`
      );
      return ctx.wizard.next();
    }
  } catch (e) {
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${JSON.stringify(e)}`);
    return mainMenuHandler(ctx);
  }
};

const step2 = new Composer();

const amountHandler = () => {
  return async (ctx) => {
    if (Number(ctx.message?.text)) {
      ctx.scene.state.amount = Number(ctx.message?.text) * 1000000; //to lovelace;
    } else {
      ctx.scene.state.amount = Number(ctx.session.amountToSend) * 1000000; //to lovelace;
    }
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
      const unsignedTx = {
        unsignedTxHex: Buffer.from(txBuild.to_bytes()).toString("hex"),
        time: Date.now(),
        balance: wallet.balance.available.quantity,
        amount,
        fee: txBuild.fee().to_str(),
        coinSelection: JSON.parse(JSON.stringify(coinSelection)),
      };
      await writeToSession(getSessionKey(ctx), "unsignedTx", unsignedTx);
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
      replyMenu(ctx, `${e.response?.data?.message || e.message}\n`);
      return ctx.wizard.leave();
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

step4.on("text", async (ctx) => {
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
  let wallet = makeShelleyWallet(ctx.scene.state.wallet);
  ctx.scene.state.transaction = JSON.parse(
    JSON.stringify(await wallet.getTransaction(ctx.scene.state.transaction.id))
  ); //refresh txn
  const { transaction } = ctx.scene.state;

  if (transaction.status === "in_ledger") {
    await ctx.replyWithHTML(
      `Transaction Details:\n${formatTxnData(transaction)}`,
      [
        Markup.button.url(
          "More Details",
          `https://testnet.cardanoscan.io/transaction/${transaction.id}`
        ),
      ],
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

const sendToUserIdScene = new Scenes.WizardScene(
  "sendToUserIdScene",
  step1,
  step2,
  step3,
  step4,
  step5
);

module.exports = { sendToUserIdScene };
