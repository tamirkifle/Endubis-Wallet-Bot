const { Scenes, Composer, Markup } = require("telegraf");
// const { getWalletById } = require("../utils/walletUtils");
const { mainMenuButton } = require("../utils/btnMenuHelpers");
const { formatTxnData } = require("../utils/formatTxnData");
const { getTransactions } = require("../utils/newWalletUtils/newWalletUtils");
const { getWalletById } = require("../utils/walletUtils");

const step1 = (ctx) => {
  ctx.reply(
    `Please choose a filter option to see your list of transactions`,
    Markup.inlineKeyboard([
      [Markup.button.callback("By Time Frame 🕒", "txns-by-time")],
      [Markup.button.callback("Sent 🔺", "txns-sent")],
      [Markup.button.callback("Received 🟢", "txns-received")],
      [Markup.button.callback("All transactions 📜", "txns-all")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

/* 
Step 1
- Give user choice of time frame
  - Past month
  - Past 3 months
  - Past 6 months
  - Past year
  - All time
  - ?? TODO: Custom time frame ??

*/

const step2 = new Composer();
step2.action("txns-by-time", (ctx) => {
  ctx.reply(
    `Choose time frame to see transactions`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Past week", "txns-past-week")],
      [Markup.button.callback("Past month", "txns-past-month")],
      [Markup.button.callback("Past 3 months", "txns-past-3-months")],
      [Markup.button.callback("Past 6 months", "txns-past-6-months")],
      [Markup.button.callback("Past year", "txns-past-year")],
      [Markup.button.callback("All time", "txns-all-time")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
});

step2.action("txns-sent", (ctx) =>
  txnListHandler(ctx, { direction: "outgoing" })
);
step2.action("txns-received", (ctx) =>
  txnListHandler(ctx, { direction: "incoming" })
);
step2.action("txns-all", (ctx) => txnListHandler(ctx));

/* 
Step 2
- IF user choice is not CUSTOM
  - Get transactions for chosen time frame
- IF user choice is CUSTOM
  - Ask for start date
*/

const txnListHandler = async (
  ctx,
  { months: monthsOfTxns = undefined, direction } = {}
) => {
  // const wallet = await getWalletById(ctx.session.xpubWalletId);
  let wallet;
  try {
    wallet = await getWalletById(ctx.session.xpubWalletId);
  } catch (error) {
    wallet = null;
  }
  let txns;
  if (monthsOfTxns) {
    const oneMonthInMS = 2629800000;
    const endDate = new Date(Date.now());
    const startDate = new Date(Date.now() - oneMonthInMS * monthsOfTxns);
    if (wallet?.state?.status === "ready") {
      txns = await wallet.getTransactions(startDate, endDate);
    } else {
      txns = await getTransactions(ctx);
    }
  } else if (direction) {
    if (wallet?.state?.status === "ready") {
      txns = await wallet.getTransactions();
    } else {
      txns = await getTransactions(ctx);
    }
    txns = txns.filter(
      (txn) => txn.direction === String(direction).toLowerCase()
    );
  } else {
    if (wallet?.state?.status === "ready") {
      txns = await wallet.getTransactions();
    } else {
      txns = await getTransactions(ctx);
    }
  }
  const customInlineKeyboard = (index, txnId) => {
    if (index === txns.length - 1) {
      return Markup.inlineKeyboard([
        [
          Markup.button.url(
            "More Details",
            `https://testnet.cardanoscan.io/transaction/${txnId}`
          ),
        ],
        [mainMenuButton()],
      ]);
    }
    return Markup.inlineKeyboard([
      [
        Markup.button.url(
          "More Details",
          `https://testnet.cardanoscan.io/transaction/${txnId}`
        ),
      ],
    ]);
  };

  for (const [index, txn] of txns.entries()) {
    await ctx.replyWithHTML(
      `${index === 0 ? "Click More Details to see more." : ""}
  
<b>#${txns.length - index} of ${txns.length} Transactions</b>
${formatTxnData(txn)}`,
      customInlineKeyboard(index, txn.id)
    );
  }
  return;
};

const step3 = new Composer();
step3.action("txns-all-time", (ctx) => txnListHandler(ctx));
step3.action("txns-past-week", (ctx) =>
  txnListHandler(ctx, { months: 7 / 30 })
);
step3.action("txns-past-month", (ctx) => txnListHandler(ctx, { months: 1 }));
step3.action("txns-past-3-months", (ctx) => txnListHandler(ctx, { months: 3 }));
step3.action("txns-past-6-months", (ctx) => txnListHandler(ctx, { months: 6 }));
step3.action("txns-past-year", (ctx) => txnListHandler(ctx, { months: 12 }));

const viewTransactionsScene = new Scenes.WizardScene(
  "viewTransactionsScene",
  step1,
  step2,
  step3
);

module.exports = { viewTransactionsScene };
