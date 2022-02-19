const { Markup } = require("telegraf");

const mainMenuHandler = (ctx) => {
  //If in a scene, leave it.
  ctx.scene?.leave();
  console.log("Main Menu Called");
  ctx.reply(
    "Welcome to the Wallet Bot",
    Markup.inlineKeyboard([
      Markup.button.callback("Create New Wallet", "create-wallet"),
      Markup.button.callback(
        "Restore a Wallet with Seed Phrase",
        "restore-wallet"
      ),
    ])
  );
};

module.exports = { mainMenuHandler };
