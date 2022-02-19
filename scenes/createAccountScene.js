const { Scenes, Markup, Composer } = require("telegraf");
const { generateSeedHandler } = require("../handlers/generateSeedHandler");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");

const step1 = (ctx) => {
  ctx.replyWithHTML(
    `Your wallet is secured with a <b>mneomonic phrase</b> (also known as the <b>seed phrase</b>). 
Write the mnemonic phrase down and keep it safe from prying eyes, you will need it to access your wallet. 
<b>Don’t copy it to your clipboard or save it anywhere online.</b>`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Show seed phrase", "generate-seed")],
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
};

const step2 = new Composer();

step2.action("generate-seed", generateSeedHandler);

step2.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));

step2.action("delete-then-restore", (ctx) => {
  ctx.deleteMessage();
  Scenes.Stage.enter("restoreAccountScene")(ctx);
});
//If asked to go back to menu, handle that action and don't trying the fallback handler on step2.use
step2.action("back-to-menu", mainMenuHandler);

//fallback
step2.use((ctx) => {
  ctx.reply(
    "Invalid Entry. Please select from one of the buttons below",
    Markup.inlineKeyboard([
      [Markup.button.callback("Show seed phrase", "generate-seed")],
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
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
