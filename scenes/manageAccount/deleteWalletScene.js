const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { deleteWallet } = require("../../utils/newWalletUtils/newWalletUtils");
const { replyMenu } = require("../../utils/btnMenuHelpers");

/*
Steps: 
- Ask user to enter old passphrase
- Ask user to enter new passphrase
- Ask user to repeat new passphrase
- Give message about success or failure of change and show back to main menu button
*/

/*
Step 1:
- Ask for old Passphrase
*/

const step1 = (ctx) => {
  ctx.replyWithHTML(
    `Are you sure you want to <b>delete</b> this wallet from our database.\nThe wallet will still be available on the blockchain`,
    Markup.keyboard([["✅ Yes"], ["❌ No"]])
      .oneTime()
      .resize()
  );
  return ctx.wizard.next();
};

/*
Step 2:
- Validate old passphrase
- Ask for new Passphrase
*/
const step2 = new Composer();
step2.hears("✅ Yes", async (ctx) => {
  await ctx.reply("Deleting Wallet...", Markup.removeKeyboard());
  try {
    ctx.session = null;
  } catch (e) {
    console.log(e);
    //TODO - Better error messages
    replyMenu(ctx, "ERROR: Something went wrong");
  }
  replyMenu(ctx, "Wallet Successfully Deleted");
  return ctx.scene.leave();
});
step2.hears("❌ No", async (ctx) => {
  await ctx.reply("Aborting...", Markup.keyboard([["🏠 Main Menu"]]).resize());

  return mainMenuHandler(ctx);
});

const deleteWalletScene = new Scenes.WizardScene(
  "deleteWalletScene",
  step1,
  step2
);

module.exports = { deleteWalletScene };
