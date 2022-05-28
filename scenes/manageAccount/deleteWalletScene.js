const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { deleteWallet } = require("../../utils/walletUtils");
const {
  replyMenu,
  replyText,
  replyHTML,
} = require("../../utils/btnMenuHelpers");
const { deleteMessage } = require("../../handlers/deleteMessageHandler");

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
  replyHTML(
    ctx,
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
  const deletingReply = await replyText(
    ctx,
    "Deleting Wallet...",
    Markup.removeKeyboard()
  );
  try {
    await deleteWallet(ctx.session.xpubWalletId);
    await deleteMessage(deletingReply);
    await replyMenu(ctx, "Wallet Successfully Deleted");
    const { messageIdsToDelete } = ctx.session;
    ctx.session = null;
    ctx.session.messageIdsToDelete = messageIdsToDelete;
  } catch (e) {
    console.error(e);
    //TODO - Better error messages
    await replyMenu(ctx, "ERROR: Something went wrong");
  }
  return ctx.scene.leave();
});
step2.hears("❌ No", async (ctx) => {
  const abortReply = await replyMenu(
    ctx,
    "Aborting...",
    Markup.keyboard([["🏠 Main Menu"]]).resize()
  );
  await deleteMessage(abortReply);

  return mainMenuHandler(ctx);
});

const deleteWalletScene = new Scenes.WizardScene(
  "deleteWalletScene",
  step1,
  step2
);

module.exports = { deleteWalletScene };
