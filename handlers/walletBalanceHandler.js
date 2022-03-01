const { Markup } = require("telegraf");
const { mainMenuButton, replyMenuHTML } = require("../utils/btnMenuHelpers");
const { getWalletById } = require("../utils/loadAccount");
const { mainMenuHandler } = require("./mainMenuHandler");

const formatWalletData = (wallet, name) => {
  return `Here's your wallet information, ${name}:

Wallet Total Balance: <tg-spoiler>${
    wallet.balance.total.quantity / 1000000
  } ada</tg-spoiler>
Wallet Available Balance: <tg-spoiler>${
    wallet.balance.available.quantity / 1000000
  } ada</tg-spoiler>
`;
};

const walletBalanceHandler = async (ctx) => {
  if (!ctx.session?.loggedInWalletId) {
    return mainMenuHandler(ctx);
  }
  const wallet = await getWalletById(ctx.session.loggedInWalletId);
  if (wallet.state.status !== "ready") {
    await ctx.reply(
      `Hey there. Your wallet is syncing. Please Wait...
        
Progress: ${wallet.state.progress.quantity} ${wallet.state.progress.unit}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Refresh", "wallet-balance")],
        [mainMenuButton()],
      ])
    );
  } else {
    replyMenuHTML(ctx, formatWalletData(wallet, ctx.from.first_name));
  }
};

module.exports = { walletBalanceHandler };
