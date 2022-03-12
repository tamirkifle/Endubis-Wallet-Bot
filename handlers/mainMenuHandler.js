const { Markup } = require("telegraf");

const mainMenuHandler = async (ctx) => {
  //If in a scene, leave it.
  ctx.scene?.leave();

  // await ctx.deleteMessage(goingMsg.from.id, goingMsg.message_id);
  if (ctx.session?.loggedInWalletId) {
    const userFirstName =
      ctx.update?.message?.from?.first_name ??
      ctx.update?.callback_query?.from?.first_name;
    const userId =
      ctx.update?.message?.from?.id ?? ctx.update?.callback_query?.from?.id;
    if (ctx.update.message?.text === "/start") {
      await ctx.reply(
        "👋 Welcome back to your wallet",
        Markup.keyboard([["🏠 Main Menu"]]).resize()
      );
    }
    return ctx.replyWithHTML(
      `Please choose an option, <a href="tg://user?id=${userId}">${userFirstName}</a>`,
      Markup.inlineKeyboard([
        [Markup.button.callback(" 👁️‍🗨️ View Balance", "wallet-balance")],
        [
          Markup.button.callback("📩 Receive", "receive"),
          Markup.button.callback("💸 Send", "send"),
        ],
        [Markup.button.callback("📒 Transaction History", "view-transactions")],
        [Markup.button.callback(" ⚙️ Manage Account", "manage-account")],
        [Markup.button.callback("🚪 Logout", "log-out")],
      ])
    );
  } else {
    const welcomeMsg = await ctx.reply(
      "Welcome to the Endubis Wallet 🛅",
      Markup.keyboard([["🏠 Main Menu"]]).resize()
    );
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
