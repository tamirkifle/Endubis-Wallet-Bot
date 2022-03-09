const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");
const { walletBalanceHandler } = require("../handlers/walletBalanceHandler");
const { replyMenu, replyMenuHTML } = require("../utils/btnMenuHelpers");
const {
  loadAccountFromSeed,
  idFromSeed,
  getWalletById,
} = require("../utils/loadAccount");

/*
Step 1: 
- Ask user for the seed phrase (with an option to cancel and go back to the main menu)
*/

const step1 = (ctx) => {
  replyMenu(ctx, `Please enter your seed key to access your account`);
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
step2.start(mainMenuHandler);
step2.on("text", async (ctx) => {
  //TODO: Validate the seed phrase
  if (ctx.message.text.trim().split(" ").length < 15) {
    replyMenu(ctx, "That doesn't seem like a valid seed phrase. Try Again");
    return;
  }
  ctx.scene.state.seedPhrases = ctx.message.text.toLowerCase();
  const id = await idFromSeed(ctx.scene.state.seedPhrases);
  const existingWallet = await getWalletById(id);
  if (existingWallet) {
    await ctx.reply("Wallet already exists in database. Loading the wallet.");
    ctx.session.loggedInWalletId = id;
    return mainMenuHandler(ctx);
  }
  replyMenu(
    ctx,
    `Please enter a passphrase to secure you account (10 characters or more)`
  );
  return ctx.wizard.next();
});

//If asked to go back to menu, handle that action and don't trying the fallback handler on step2.use
step2.action("back-to-menu", mainMenuHandler);

step2.use((ctx) => {
  replyMenu(ctx, "Only Text supported for your seed phrase. Try Again.");
  return;
});

/*
  Step 3
  - Validate passphrase
  - Save passphrase in local state
  - Set Wallet Name to the user_id (ctx.from.id)
  - Load wallet
  */

const step3 = new Composer();
step3.start(mainMenuHandler);

step3.on("text", async (ctx) => {
  if (ctx.message.text.length < 10) {
    replyMenu(ctx, `Passphrase must be at least 10 characters long. Try again`);
    return;
  }
  const passphrase = ctx.message.text;
  try {
    const wallet = await loadAccountFromSeed(
      ctx.scene.state.seedPhrases,
      passphrase,
      String(ctx.from.id)
    );
    ctx.session.loggedInWalletId = wallet.id;
    await ctx.reply(`Weclcome to your account\n`);
    mainMenuHandler(ctx);
  } catch (e) {
    replyMenuHTML(ctx, `🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
  }
  return ctx.scene.leave();
});

const restoreAccountScene = new Scenes.WizardScene(
  "restoreAccountScene",
  (ctx) => step1(ctx),
  step2,
  step3
);

module.exports = { restoreAccountScene };
