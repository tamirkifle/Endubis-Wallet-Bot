const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");

/*
Steps: 
- Ask user to enter old passphrase
- Ask user to enter new passphrase
- Ask user to repeat new passphrase
- Give message about success or failure of change and show back to main menu button
*/

const step1 = (ctx) => {
  ctx.reply(
    `Please enter your old passphrase to get started`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
};
const step2 = new Composer();

step2.on("text", (ctx) => {
  console.log("Old Passphrase reply: ", ctx.update.message?.text);
  ctx.reply(
    `Please enter your desired new passphrase`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
  // return ctx.scene.leave();
});

const step3 = new Composer();

step3.on("text", (ctx) => {
  console.log("New Passphrase reply: ", ctx.update.message?.text);
  ctx.reply(
    `Please repeat the new passphrase`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
  // return ctx.scene.leave();
});

const step4 = new Composer();

step4.on("text", (ctx) => {
  console.log("Repeat Passphrase reply: ", ctx.update.message?.text);
  //TODO: CHECK IF THE TWO NEW PASSCODES ARE THE SAME
  //  IF NOT GO TO STEP 2
  //  IF THE SAME, CHANGE PASSCODE WITH UTIL
  //    IF ERROR: SHOW ERROR MESSAGE
  //    IF SUCCESS: SHOW SUCCESS MESSAGE

  return ctx.scene.leave();
});
const changePassphraseScene = new Scenes.WizardScene(
  "changePassphraseScene",
  step1,
  step2
  // step3
);

module.exports = { changePassphraseScene };
