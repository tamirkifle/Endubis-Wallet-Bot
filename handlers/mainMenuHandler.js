const { Markup } = require("telegraf");

const mainMenuHandler = (ctx) => {
  //If in a scene, leave it.
  ctx.scene?.leave();
  if (ctx.session?.loggedInWalletId) {
    const userFirstName =
      ctx.update?.message?.from?.first_name ??
      ctx.update?.callback_query?.from?.first_name;
    const userId =
      ctx.update?.message?.from?.id ?? ctx.update?.callback_query?.from?.id;

    if (ctx.update.message?.text === "/start") {
      ctx.replyWithMarkdownV2(
        `👋 Welcome back to your wallet, [${userFirstName}](tg://user?id=${userId})`
      );
    }

    ctx.replyWithMarkdownV2(
      `Please choose an option, [${userFirstName}](tg://user?id=${userId})`,
      Markup.inlineKeyboard([
        [Markup.button.callback(" 👁️‍🗨️ View Balance", "wallet-balance")],
        [Markup.button.callback(" ⚙️ Manage Account", "manage-account")],
        [Markup.button.callback("🚪 Logout", "log-out")],
      ])
    );
  } else {
    ctx.replyWithMarkdownV2(
      `Please *CREATE* or *RESTORE* a wallet to get started`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Create a New Wallet", "create-wallet")],
        [Markup.button.callback("🗝 Restore a Wallet", "restore-wallet")],
      ])
    );
  }
};

module.exports = { mainMenuHandler };
