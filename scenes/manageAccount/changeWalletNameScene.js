const { Scenes, Composer } = require("telegraf");
const { getWalletById } = require("../../utils/loadAccount");
const { replyMenu, replyMenuHTML } = require("../../utils/btnMenuHelpers");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");

/* 
Step 1
- Show Wallet Name
- Ask for new a wallet name
*/
let wallet = {};
const step1 = async (ctx) => {
  wallet = await getWalletById(ctx.session.loggedInWalletId);
  replyMenuHTML(
    ctx,
    `Your current wallet name is: <b>${wallet.name}</b>\n\nPlease enter the new wallet name you'd like to change this into`
  );
  return ctx.wizard.next();
};

/* 
Step 2
- Change wallet name
*/
const step2 = new Composer();
step2.start(mainMenuHandler);
step2.hears("🏠 Main Menu", mainMenuHandler);

step2.on("text", async (ctx) => {
  const newWalletName = ctx.message?.text;
  try {
    await wallet.rename(newWalletName);
    replyMenuHTML(
      ctx,
      `Wallet name successfully changed to <b>${newWalletName}</b>`
    );
  } catch (e) {
    console.log(e);
    replyMenu(ctx, `🔴 ERROR\n\n${e.response?.data?.message}`);
  }
  return ctx.scene.leave();
});

const changeWalletNameScene = new Scenes.WizardScene(
  "changeWalletNameScene",
  step1,
  step2
);

module.exports = { changeWalletNameScene };
