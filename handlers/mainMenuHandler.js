const { Markup } = require("telegraf");
const { clientBaseUrl } = require("../utils/urls");

const mainMenuHandler = async (ctx) => {
  const createLink = `${clientBaseUrl}/create?userId=${ctx.from.id}`;
  const restoreLink = `${clientBaseUrl}/restore?userId=${ctx.from.id}`;

  //If in a scene, leave it.
  ctx.scene?.leave();

  // await ctx.deleteMessage(goingMsg.from.id, goingMsg.message_id);
  if (ctx.session.loggedInWalletId) {
    if (ctx.message?.text === "/start") {
      await ctx.reply(
        "👋 Welcome back to your wallet",
        Markup.keyboard([["🏠 Main Menu"]]).resize()
      );
    }
    return ctx.replyWithHTML(
      `Please choose an option, <b><a href="tg://user?id=${ctx.session.userInfo?.id}">${ctx.session.userInfo?.first_name}</a></b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback(" 👁️‍🗨️ View Balance", "wallet-balance")],
        [
          Markup.button.callback("📩 Receive", "receive"),
          Markup.button.callback("💸 Send", "send"),
        ],
        [Markup.button.callback("💳 Buy", "deposit")],
        [Markup.button.callback("📒 Transaction History", "view-transactions")],
        [Markup.button.callback(" ⚙️ Manage Account", "manage-account")],
        [Markup.button.callback("🚪 Logout", "log-out")],
      ])
    );
  } else {
    await ctx.reply(
      "Welcome to the Endubis Wallet 🛅",
      Markup.keyboard([["🏠 Main Menu"]]).resize()
    );
    return ctx.replyWithHTML(
      `Please <b>CREATE</b> or <b>RESTORE</b> a wallet to get started`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🆕 Create a New Wallet", "create-wallet")],
        [Markup.button.callback("🗝 Restore a Wallet", "restore-wallet")],
        [Markup.button.url("🗝 Secure Create (Testing)", createLink)],
        [Markup.button.url("🗝 Secure Restore (Testing)", restoreLink)],
      ])
    );
  }
};

module.exports = { mainMenuHandler };
