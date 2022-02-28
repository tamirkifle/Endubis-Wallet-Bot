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

    return ctx.replyWithHTML(
      `${
        ctx.update.message?.text === "/start"
          ? `👋 Welcome back to your wallet\n\n`
          : ""
      }Please choose an option, <a href="tg://user?id=${userId}">${userFirstName}</a>`,
      Markup.inlineKeyboard([
        [Markup.button.callback(" 👁️‍🗨️ View Balance", "wallet-balance")],
        [Markup.button.callback("📥 Receive", "receive")],
        [Markup.button.callback("📒 Transaction History", "view-transactions")],
        [Markup.button.callback(" ⚙️ Manage Account", "manage-account")],
        [Markup.button.callback("🚪 Logout", "log-out")],
      ])
    );
  } else {
    return ctx.replyWithHTML(
      `Please <b>CREATE</b> or <b>RESTORE</b> a wallet to get started`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Create a New Wallet", "create-wallet")],
        [Markup.button.callback("🗝 Restore a Wallet", "restore-wallet")],
      ])
    );
  }
};

module.exports = { mainMenuHandler };
