const { Markup } = require("telegraf");
const { mainMenuButton, replyMenuHTML } = require("../utils/btnMenuHelpers");
const { getWalletById } = require("../utils/walletUtils");
const { mainMenuHandler } = require("./mainMenuHandler");

const formatWalletDataHTML = (wallet, name) => {
  /*<b>Available Balance:</b> <tg-spoiler><i>${
    wallet.balance.available.quantity / 1000000
  } ada</i></tg-spoiler>*/
  return `Here's your wallet information, <b>${name}</b>:

<b>Total Balance:</b> <tg-spoiler><i>${
    wallet.balance.total.quantity / 1000000
  } ada</i></tg-spoiler>
`;
};

const walletBalanceHandler = async (ctx) => {
  if (!ctx.session.loggedInWalletId) {
    return mainMenuHandler(ctx);
  }
  const wallet = await getWalletById(ctx.session.loggedInWalletId);
  if (wallet.state.status !== "ready") {
    if (ctx.update.callback_query?.data === "refresh-balance") {
      //not to delete the main menu when I click view balance
      try {
        await ctx.deleteMessage();
      } catch (e) {
        console.log({ e });
      }
    }
    await ctx.replyWithHTML(
      `Hey <b><a href="tg://user?id=${ctx.session.userInfo?.id}">${ctx.session.userInfo?.first_name}</a></b>. Your wallet is syncing. Please Wait...
        
Progress: ${wallet.state.progress.quantity} ${wallet.state.progress.unit}`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Refresh", "refresh-balance")],
        [mainMenuButton()],
      ])
    );
  } else {
    replyMenuHTML(
      ctx,
      formatWalletDataHTML(wallet, ctx.session.userInfo?.first_name)
    );
  }
};

module.exports = { walletBalanceHandler };
