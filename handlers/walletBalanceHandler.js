const { Markup } = require("telegraf");
const { replyMenu, mainMenuButton } = require("../utils/btnMenuHelpers");
const {
  formatWalletData,
  getWalletById,
  walletServerInfo,
} = require("../utils/loadAccount");
const { mainMenuHandler } = require("./mainMenuHandler");

const walletBalanceHandler = async (ctx) => {
  if (!ctx.session?.loggedInWalletId) {
    return mainMenuHandler(ctx);
  }
  const wallet = await getWalletById(ctx.session.loggedInWalletId);
  if (wallet.state.status !== "ready") {
    await ctx.reply(
      `Hey there. Your wallet is syncing. Please Wait...
        
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
};

module.exports = { walletBalanceHandler };
