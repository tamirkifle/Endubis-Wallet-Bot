const { Markup } = require("telegraf");
const { replyMenu, mainMenuButton } = require("../utils/btnMenuHelpers");
const {
  formatWalletData,
  getWalletById,
  walletServerInfo,
} = require("../utils/loadAccount");

const walletBalanceHandler = async (ctx) => {
  if (ctx.session && ctx.session.loggedInWalletId) {
    const wallet = await getWalletById(ctx.session.loggedInWalletId);
    if (wallet.state.status !== "ready") {
      await ctx.reply(
        `Hey there. Your wallet is still syncing. Please Wait...
        
Wallet Name: ${wallet.name}
Progress: ${wallet.state.progress.quantity} ${wallet.state.progress.unit}`,
        Markup.inlineKeyboard([
          [Markup.button.callback("Refresh", "wallet-balance")],
          [mainMenuButton()],
        ])
      );
    } else {
      replyMenu(ctx, formatWalletData(wallet));
    }
  } else {
    replyMenu(ctx, `No wallet associated!`);
    return;
  }
};

module.exports = { walletBalanceHandler };
