const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const { mainMenuButton } = require("../utils/btnMenuHelpers");
const {
  changePassphraseScene,
} = require("./manageAccount/changePassphraseScene");
/*
Step 1: 
- Show Manage Account Menu
  - Change Your Passphrase
  - Change Wallet Name
  - Change default address
*/

const step1 = (ctx) => {
  ctx.replyWithMarkdownV2(
    `Please choose an option below to manage your account`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Change Passphrase", "change-passphrase")],
      [Markup.button.callback("Change Wallet Name", "change-wallet-name")],
      [
        Markup.button.callback(
          "Change Default Address",
          "change-default-address"
        ),
      ],
      [Markup.button.callback("Delete Account", "delete-wallet")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

/*
Step 2: 
- Enter Change Passphrase Scene when Change passphrase is selected

*/

const step2 = new Composer();
step2.action("change-passphrase", Scenes.Stage.enter("changePassphraseScene"));
step2.action("delete-wallet", Scenes.Stage.enter("deleteWalletScene"));

const manageAccountScene = new Scenes.WizardScene(
  "manageAccountScene",
  step1,
  step2
);

module.exports = { manageAccountScene };
