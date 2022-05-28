const { replyMenuHTML } = require("../utils/btnMenuHelpers");
// const { getWalletById } = require("../utils/walletUtils");
const { getBalance } = require("../utils/newWalletUtils");
const { getWalletById } = require("../utils/walletUtils");
const { mainMenuHandler } = require("./mainMenuHandler");

const formatWalletDataHTML = (walletBalance, name) => {
  if (typeof walletBalance === "object") {
    walletBalance = walletBalance.balance.total.quantity;
  }
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
  const wallet = await getWalletById(ctx.session.xpubWalletId);
  if (wallet?.state?.status === "ready") {
    await replyMenuHTML(
      ctx,
      formatWalletDataHTML(wallet, ctx.session.userInfo?.first_name)
    );
  } else {
    const walletBalance = await getBalance(ctx);

    await replyMenuHTML(
      ctx,
      formatWalletDataHTML(walletBalance, ctx.session.userInfo?.first_name)
    );
  }
};

module.exports = { walletBalanceHandler };
