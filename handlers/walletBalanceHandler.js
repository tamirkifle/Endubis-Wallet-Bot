const { Markup } = require("telegraf");
const { mainMenuButton, replyMenuHTML } = require("../utils/btnMenuHelpers");
// const { getWalletById } = require("../utils/walletUtils");
const {
  getBalanceFromSession,
} = require("../utils/newWalletUtils/newWalletUtils");
const { mainMenuHandler } = require("./mainMenuHandler");

const formatWalletDataHTML = (walletBalance, name) => {
  /*<b>Available Balance:</b> <tg-spoiler><i>${
    wallet.balance.available.quantity / 1000000
  } ada</i></tg-spoiler>*/
  return `Here's your wallet information, <b>${name}</b>:

<b>Total Balance:</b> <tg-spoiler><i>${
    walletBalance / 1000000
  } ada</i></tg-spoiler>
`;
};

const walletBalanceHandler = async (ctx) => {
  if (!ctx.session.loggedInXpub) {
    return mainMenuHandler(ctx);
  }
  // const wallet = await getWalletById(ctx.session.loggedInWalletId);
  const walletBalance = await getBalanceFromSession(ctx.session);

  replyMenuHTML(
    ctx,
    formatWalletDataHTML(walletBalance, ctx.session.userInfo?.first_name)
  );
};

module.exports = { walletBalanceHandler };
