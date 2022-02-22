const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const {
  loadAccountFromSeed,
  formatWalletData,
} = require("../utils/loadAccount");

/*
Step 1: 
- Ask user for the seed phrase with an option to cancel and go back to the main menu
*/

const step1 = (ctx) => {
  ctx.reply(
    `Please enter your seed key to access your account`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
};

/*
Step 2: 
- Validate the Seed Phrase
- Ask user for Passphrase
-  
*/
const step2 = new Composer();
let seedPhrases = "";

step2.on("text", (ctx) => {
  //TODO: Validate the seed phrase
  if (ctx.message.text.trim().split(" ").length < 15) {
    ctx.reply(
      "That doesn't seem like a valid seed phrase. Try Again",
      Markup.inlineKeyboard([
        [Markup.button.callback("Back to Main Menu", "back-to-menu")],
      ])
    );
    return;
  }
  seedPhrases = ctx.message.text;
  ctx.reply(
    "I have received the seed phrase...",
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
});

const step3 = new Composer();

step3.use((ctx) => {
  ctx.reply(
    `Please enter a passphrase to secure you account (10 characters or more)`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
});

const step4 = new Composer();

let passphrase = "";
step4.on("text", (ctx) => {
  passphrase = ctx.message.text;
  console.log({ passphrase });
  ctx.reply(
    `Please enter a name for this wallet`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
});

const step5 = new Composer();

let walletName = "";
step5.on("text", async (ctx) => {
  walletName = ctx.message.text;
  console.log({ walletName, passphrase });
  const wallet = await loadAccountFromSeed(seedPhrases, passphrase, walletName);

  ctx.reply(
    formatWalletData(wallet),
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.scene.leave();
});

//If asked to go back to menu, handle that action and don't trying the fallback handler on step2.use
step2.action("back-to-menu", mainMenuHandler);

step2.use((ctx) => {
  ctx.reply(
    "Only Text supported for your seed phrase. Try Again.",
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return;
});

const restoreAccountScene = new Scenes.WizardScene(
  "restoreAccountScene",
  (ctx) => step1(ctx),
  step2,
  step3,
  step4,
  step5
);

module.exports = { restoreAccountScene };
