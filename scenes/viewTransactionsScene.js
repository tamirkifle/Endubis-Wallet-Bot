const { Scenes, Composer, Markup } = require("telegraf");
// const { getWalletById } = require("../utils/walletUtils");
const { mainMenuButton } = require("../utils/btnMenuHelpers");
const { formatTxnData } = require("../utils/formatTxnData");
const { getTransactions } = require("../utils/newWalletUtils");
const { getWalletById } = require("../utils/walletUtils");

const goToTxnMainMenu = async (ctx) => {
  await ctx.reply(
    `Please choose a filter option to see your list of transactions`,
    Markup.inlineKeyboard([
      [Markup.button.callback("By Time Frame 🕒", "txns-by-time")],
      [Markup.button.callback("Sent 🔺", "txns-sent")],
      [Markup.button.callback("Received 🟢", "txns-received")],
      [Markup.button.callback("All transactions 📜", "txns-all")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.selectStep(0);
};

const goToTxnByTimeMenu = async (ctx) => {
  await ctx.reply(
    `Choose time frame to see transactions`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Past week", "txns-past-week")],
      [Markup.button.callback("Past month", "txns-past-month")],
      [Markup.button.callback("Past 3 months", "txns-past-3-months")],
      [Markup.button.callback("Past 6 months", "txns-past-6-months")],
      [Markup.button.callback("Past year", "txns-past-year")],
      [Markup.button.callback("All time", "txns-all-time")],
      [Markup.button.callback("Go Back", "back-to-txns-menu")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.selectStep(1);
};

let txns;

const getTransactionsHelper = async (
  ctx,
  { monthsOfTxns, direction, xpubWalletId }
) => {
  let wallet, txns;
  wallet = await getWalletById(xpubWalletId);
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
  return txns;
};

const txnsViewerHelper = async (
  ctx,
  { transactions: txns = [], pageNumber, txnsPerPage }
) => {
  // let fromMainMenu =
  //   ctx.wizard.cursor === 0 ||
  //   (["previous-page", "next-page"].includes(ctx.callbackQuery?.data) &&
  //     ctx.wizard.cursor === 1);
  let totalPages = Math.ceil(txns.length / txnsPerPage);
  let txnStartIndex = (pageNumber - 1) * txnsPerPage;
  let txnsToShow = txns.slice(txnStartIndex, txnStartIndex + txnsPerPage);
  const txnListControls = () => {
    return [
      ...(pageNumber > 1
        ? [
            [
              Markup.button.callback(
                ` ◀️ Go to Page ${pageNumber - 1} (of ${totalPages})`,
                "previous-page"
              ),
            ],
          ]
        : []),

      ...(pageNumber < totalPages
        ? [
            [
              Markup.button.callback(
                ` ▶️ Go to Page ${pageNumber + 1} (of ${totalPages})`,

                "next-page"
              ),
            ],
          ]
        : []),
      [Markup.button.callback("Go Back", "back-to-previous-menu")],
      [mainMenuButton()],
    ];
  };

  if (txns.length === 0) {
    await ctx.replyWithHTML(
      `No Transactions to Show`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Go Back", "back-to-previous-menu")],
        [mainMenuButton()],
      ])
    );
  }
  const txnMessages = [];
  for (const [index, txn] of txnsToShow.entries()) {
    const { message_id } =
      (await ctx.replyWithHTML(
        `${index === 0 ? "Click More Details to see more." : ""}
  
<b>#${txns.length - index - txnStartIndex} of ${txns.length} Transactions</b>
${formatTxnData(txn)}`,
        Markup.inlineKeyboard([
          [
            Markup.button.url(
              "More Details",
              `https://testnet.cardanoscan.io/transaction/${txn.id}`
            ),
          ],
          ...(index === txnsToShow.length - 1 ? txnListControls() : []),
        ])
      )) || {};
    message_id && txnMessages.push(message_id);
  }
  ctx.session.messageIdsToDelete = [
    ...txnMessages,
    ...(ctx.session.messageIdsToDelete || []),
  ];
};

const txnListHandler =
  ({
    months: monthsOfTxns = undefined,
    direction,
    pageNumber = 1,
    transactions = null,
  } = {}) =>
  async (ctx) => {
    const { xpubWalletId, settings } = ctx.session;
    const txnsPerPage = settings?.txnsPerPage || 5;
    txns =
      transactions ||
      (await getTransactionsHelper(ctx, {
        monthsOfTxns,
        direction,
        xpubWalletId,
      }));

    ctx.session.currentPage = pageNumber;
    await txnsViewerHelper(ctx, {
      transactions: txns,
      pageNumber,
      txnsPerPage,
    });
    return;
  };

const pageHandler = async (ctx) => {
  const { currentPage } = ctx.session;
  const pageNumber =
    ctx.callbackQuery?.data === "previous-page"
      ? currentPage - 1
      : currentPage + 1;
  await txnListHandler({
    transactions: txns,
    pageNumber,
  })(ctx);
};

const step1 = new Composer();
step1.action("txns-by-time", goToTxnByTimeMenu);
step1.action("txns-sent", txnListHandler({ direction: "outgoing" }));
step1.action("txns-received", txnListHandler({ direction: "incoming" }));
step1.action("txns-all", txnListHandler());
step1.action(["previous-page", "next-page"], pageHandler);
step1.action(["back-to-previous-menu", "view-transactions"], goToTxnMainMenu);
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
step2.action("txns-all-time", txnListHandler());
step2.action("txns-past-week", txnListHandler({ months: 7 / 30 }));
step2.action("txns-past-month", txnListHandler({ months: 1 }));
step2.action("txns-past-3-months", txnListHandler({ months: 3 }));
step2.action("txns-past-6-months", txnListHandler({ months: 6 }));
step2.action("txns-past-year", txnListHandler({ months: 12 }));
step2.action(["previous-page", "next-page"], pageHandler);
step2.action("back-to-txns-menu", goToTxnMainMenu);
step2.action("back-to-previous-menu", goToTxnByTimeMenu);

// const step3 = new Composer();
// step3.action(
//   ["back-to-txns-menu", "back-to-txns-by-time-menu"],
//   async (ctx) => {
//     ctx.wizard.selectStep(0);
//     ctx.callbackQuery?.data === "back-to-txns-by-time-menu"
//       ? goToTxnByTimeMenu(ctx)
//       : goToTxnMainMenu(ctx);
//   }
// );

// step3.action(["previous-page", "next-page"], pageHandler);

// step2.action("txns-by-time", replyTxnByTimeMenu);

// step2.action("txns-sent", txnListHandler({ direction: "outgoing" }));
// step2.action("txns-received", txnListHandler({ direction: "incoming" }));
// step2.action("txns-all", txnListHandler());

/* 
Step 2
- IF user choice is not CUSTOM
  - Get transactions for chosen time frame
- IF user choice is CUSTOM
  - Ask for start date
*/

// const pageHandler = async (ctx) => {
//   const sessionData = { ...ctx.session };
//   let currentPage = sessionData.currentPage || 1,
//     txnsPerPage = sessionData.settings?.txnsPerPage || 5;
//   if (ctx.callbackQuery.data === "previous-page") {
//     await txnsViewerHelper(ctx, {
//       transactions: txns,
//       pageNumber: currentPage - 1,
//       txnsPerPage,
//     });
//     await writeToSession(getSessionKey(ctx), currentPage, currentPage - 1);
//   } else if (ctx.callbackQuery.data === "next-page") {
//     await txnsViewerHelper(ctx, {
//       transactions: txns,
//       pageNumber: currentPage + 1,
//       txnsPerPage,
//     });
//     await writeToSession(getSessionKey(ctx), currentPage, currentPage + 1);
//   }
// };
// const step3 = new Composer();

// step3.action("txns-all-time", txnListHandler());
// step3.action("txns-past-week", txnListHandler({ months: 7 / 30 }));
// step3.action("txns-past-month", txnListHandler({ months: 1 }));
// step3.action("txns-past-3-months", txnListHandler({ months: 3 }));
// step3.action("txns-past-6-months", txnListHandler({ months: 6 }));
// step3.action("txns-past-year", txnListHandler({ months: 12 }));

// const step4 = new Composer();
// step4.action("go-back", async (ctx) => {
//   ctx.wizard.selectStep(1);
//   return txnByTimeHandler(ctx);
// });

const viewTransactionsScene = new Scenes.WizardScene(
  "viewTransactionsScene",
  step1,
  step2
);

module.exports = { viewTransactionsScene };
