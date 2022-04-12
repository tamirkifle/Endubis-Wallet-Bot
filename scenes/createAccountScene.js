const { Scenes, Markup, Composer } = require("telegraf");
const { generateSeedHandler } = require("../handlers/generateSeedHandler");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const { mainMenuButton } = require("../utils/btnMenuHelpers");
const { frontendBaseUrl } = require("../utils/urls");

/*
Step 1: 
- Show Seed Phrase Warning
- Make sure the user read the warning
*/

const step1 = (ctx) => {
  const urlLink = `${frontendBaseUrl}/create?userId=${ctx.from.id}`;
  ctx.replyWithHTML(
    `Your wallet is secured with a <b>mneomonic phrase</b> (also known as the <b>seed phrase</b>). 
Write the mnemonic phrase down and keep it safe from prying eyes, you will need it to access your wallet. 
<b>Don’t copy it to your clipboard or save it anywhere online.</b>`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Generate seed phrase", "generate-seed")],
      // [Markup.button.url("Browser (Testing)", urlLink)],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

/*
Step 2: 
- Generate and Display Seed to the User
- Ask User to Delete the Phrase and Continue or to Just Continue Accessing the Wallet
- Enter the restoreAccountScene
*/

const step2 = new Composer();

step2.action("generate-seed", generateSeedHandler);

step2.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));

step2.action("delete-then-restore", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log(error);
  }
  Scenes.Stage.enter("restoreAccountScene")(ctx);
});

//If asked to go back to menu, handle that action and don't trying the fallback handler on step2.use
step2.action("back-to-menu", mainMenuHandler);
step2.hears("🏠 Main Menu", mainMenuHandler);

//fallback if anything except text is entered
step2.use((ctx) => {
  ctx.reply(
    "Invalid Entry. Please select from one of the buttons below",
    Markup.inlineKeyboard([
      [Markup.button.callback("Show seed phrase", "generate-seed")],
      [mainMenuButton()],
    ])
  );
  return;
});

const createAccountScene = new Scenes.WizardScene(
  "createAccountScene",
  (ctx) => step1(ctx),
  step2
);

module.exports = { createAccountScene };
