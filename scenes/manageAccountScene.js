const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const { mainMenuButton, replyMenuHTML } = require("../utils/btnMenuHelpers");
const { getSessionKey } = require("../firestoreInit");
const { clientBaseUrl } = require("../utils/urls");
/*
Step 1: 
- Show Manage Account Menu
  - Change Your Passphrase
  - Change Wallet Name
  - Change default address
*/

const step1 = async (ctx) => {
  if (!ctx.session.loggedInWalletId) {
    mainMenuHandler(ctx);
  } else {
    ctx.reply(
      `Please choose an option below to manage your account`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Change Passphrase", "change-passphrase")],
        [Markup.button.callback("Delete Account", "delete-wallet")],
        [mainMenuButton()],
      ])
    );
    return ctx.wizard.next();
  }
};

/*
Step 2: 
- Enter changePassphraseScene when Change passphrase is selected
- Enter deleteWalletScene when Delete Wallet is selected
- Enter changeWalletNameScene when Change Wallet Name is selected

*/

const step2 = new Composer();

step2.action("change-passphrase", (ctx) => {
  const changePassphraseLink = `${clientBaseUrl}/changepass?sessionKey=${getSessionKey(
    ctx
  )}`;
  replyMenuHTML(
    ctx,
    `Note: You will need to provide your seed phrase in order to change your passphrase.\nProceed with the following link once ready.`,
    [Markup.button.url("🗝 Change Passphrase", changePassphraseLink)]
  );
});
step2.action("delete-wallet", Scenes.Stage.enter("deleteWalletScene"));

const manageAccountScene = new Scenes.WizardScene(
  "manageAccountScene",
  step1,
  step2
);

module.exports = { manageAccountScene };
