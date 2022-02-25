const { Markup } = require("telegraf");
const { replyMenu } = require("../utils/btnMenuHelpers");
const { formatWalletData, getWalletById } = require("../utils/loadAccount");

const walletBalanceHandler = async (ctx) => {
  console.log(`getWalletById: ${getWalletById}`);
  if (ctx.session && ctx.session.loggedInWalletId) {
    const wallet = await getWalletById(ctx.session.loggedInWalletId);
    replyMenu(ctx, formatWalletData(wallet));
  } else {
    replyMenu(ctx, `No wallet associated!`);
    return;
  }
};

module.exports = { walletBalanceHandler };
