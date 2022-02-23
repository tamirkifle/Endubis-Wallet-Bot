const { Markup } = require("telegraf");
const { formatWalletData, getWalletById } = require("../utils/loadAccount");

const walletBalanceHandler = async (ctx) => {
  console.log(`getWalletById: ${getWalletById}`);
  if (ctx.session && ctx.session.loggedInWalletId) {
    const wallet = await getWalletById(ctx.session.loggedInWalletId);
    ctx.reply(
      formatWalletData(wallet),
      Markup.inlineKeyboard([
        [Markup.button.callback("Back to Main Menu", "back-to-menu")],
      ])
    );
  } else {
    ctx.replyWithMarkdownV2(
      `No wallet associated!`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Back to Main Menu", "back-to-menu")],
      ])
    );
    return;
  }
};

module.exports = { walletBalanceHandler };
