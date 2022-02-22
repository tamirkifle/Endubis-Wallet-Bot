const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const {
  loadAccountFromSeed,
  formatWalletData,
} = require("../utils/loadAccount");

/*
Step 1: 
- Ask user for the seed phrase (with an option to cancel and go back to the main menu)
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
- Check if wallet already exists
- Ask user for Passphrase
-  Store it in local state
*/
const step2 = new Composer();

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
  ctx.scene.state.seedPhrases = ctx.message.text;
  ctx.reply(
    `Please enter a passphrase to secure you account (10 characters or more)`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
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

/*
  Step 3
  - Validate passphrase
  - Save passphrase in local state
  - Ask user for wallet name
  */

const step3 = new Composer();

step3.on("text", (ctx) => {
  if (ctx.message.text.length < 10) {
    ctx.reply(`Passphrase must be at least 10 characters long. Try again`);
    return;
  }
  ctx.scene.state.passphrase = ctx.message.text;
  ctx.reply(
    `Please enter a name for this wallet`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
});

/* 
  Step 4
  - Validate Wallet Name if there are any reqts.
  - Load wallet from data in local state
  */

const step4 = new Composer();

step4.on("text", async (ctx) => {
  ctx.scene.state.walletName = ctx.message.text;
  const { seedPhrases, walletName, passphrase } = ctx.scene.state;
  const wallet = await loadAccountFromSeed(seedPhrases, passphrase, walletName);
  //TODO: handle thrown errors
  //TODO: Handle Exisitng Wallets
  ctx.reply(
    formatWalletData(wallet),
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.scene.leave();
});

const restoreAccountScene = new Scenes.WizardScene(
  "restoreAccountScene",
  (ctx) => step1(ctx),
  step2,
  step3,
  step4
);

module.exports = { restoreAccountScene };
