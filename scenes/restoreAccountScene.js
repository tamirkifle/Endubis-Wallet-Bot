const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../handlers/mainMenuHandler");

const step1 = (ctx) => {
  ctx.reply(
    `Please enter your seed key to access your account`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Back to Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
};

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

  ctx.reply(
    "I have received the seed phrase, wait while I load your account",
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
  step2
);

module.exports = { restoreAccountScene };
