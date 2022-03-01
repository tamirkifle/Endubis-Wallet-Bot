const { Scenes, Composer, Markup } = require("telegraf");
const { getWalletById } = require("../utils/loadAccount");
const {
  replyMenu,
  replyMenuHTML,
  mainMenuButton,
} = require("../utils/btnMenuHelpers");

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

const step1 = (ctx) => {
  ctx.reply(
    `Choose time frame to see transactions`,
    Markup.inlineKeyboard([
      [Markup.button.callback("All time", "txns-all-time")],
      [Markup.button.callback("Past month", "txns-past-month")],
      [Markup.button.callback("Past 3 months", "txns-past-3-months")],
      [Markup.button.callback("Past 6 months", "txns-past-6-months")],
      [Markup.button.callback("Past year", "txns-past-year")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

/* 
Step 2
- IF user choice is not CUSTOM
  - Get transactions for chosen time frame
- IF user choice is CUSTOM
  - Ask for start date
*/

const txnListHandler = async (ctx, monthsOfTxns) => {
  const wallet = await getWalletById(ctx.session?.loggedInWalletId);
  const oneMonthInMS = 2629800000;
  const endDate = new Date(Date.now());
  const startDate = new Date(Date.now() - oneMonthInMS * monthsOfTxns);
  const txns = monthsOfTxns
    ? await wallet.getTransactions(startDate, endDate)
    : await wallet.getTransactions();
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
    await ctx.reply(
      `${
        index === 0
          ? "Here is your list of transactions. Click More Details to see more."
          : ""
      }
  
Transaction #${txns.length - index}
ID: ${txn.id}
Amount: ${txn.amount.quantity / 1000000} ada
Direction: ${txn.direction.toUpperCase()}
Fee: ${txn.fee.quantity / 1000000} ada 
Status: ${txn.status.toUpperCase()}
${
  txn.inserted_at
    ? `Inserted at: ${String(new Date(txn.inserted_at.time))}`
    : ""
}
${txn.expires_at ? `Expires at: ${String(new Date(txn.expires_at.time))}` : ""}
${
  txn.pending_since
    ? `Pending Since: ${String(new Date(txn.inserted_at.time))}`
    : ""
}`,
      customInlineKeyboard(index, txn.id)
    );
  }
  return;
};

const step2 = new Composer();
step2.action("txns-all-time", (ctx) => txnListHandler(ctx));
step2.action("txns-past-month", (ctx) => txnListHandler(ctx, 1));
step2.action("txns-past-3-months", (ctx) => txnListHandler(ctx, 3));
step2.action("txns-past-6-months", (ctx) => txnListHandler(ctx, 6));
step2.action("txns-past-year", (ctx) => txnListHandler(ctx, 12));

const viewTransactionsScene = new Scenes.WizardScene(
  "viewTransactionsScene",
  step1,
  step2
);

module.exports = { viewTransactionsScene };
