const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");

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
  ctx.reply(
    `Please enter your old passphrase to get started`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
};

/*
Step 2:
- Validate old passphrase
- Ask for new Passphrase
*/

const step2 = new Composer();
step2.on("text", (ctx) => {
  if (ctx.update.message?.text.length < 10) {
    ctx.reply(
      "Passphrase can't be less than 10 characters long. Try again.",
      Markup.inlineKeyboard([
        [Markup.button.callback("Main Menu", "back-to-menu")],
      ])
    );
    return;
  }
  ctx.reply(
    `Please enter your desired new passphrase`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
  // return ctx.scene.leave();
});

/*
Step 3:
- Validate new passphrase
- Ask user to repeat the new Passphrase
*/

const step3 = new Composer();
let newpass;
step3.on("text", (ctx) => {
  console.log("New Passphrase reply: ", ctx.update.message?.text);
  newpass = ctx.update.message?.text;
  if (ctx.update.message?.text.length < 10) {
    ctx.reply("Passphrase can't be less than 10 characters long. Try again.");
    return;
  }
  ctx.reply(
    `Please repeat the new passphrase`,
    Markup.inlineKeyboard([
      [Markup.button.callback("Main Menu", "back-to-menu")],
    ])
  );
  return ctx.wizard.next();
  // return ctx.scene.leave();
});

/*
Step 4:
- CHECK IF THE TWO NEW PASSCODES ARE THE SAME
- IF NOT GO BACK TO STEP 2
  //  IF THE SAME, CHANGE PASSCODE WITH UTIL
  //    IF ERROR: SHOW ERROR MESSAGE
  //    IF SUCCESS: SHOW SUCCESS MESSAGE
*/

const step4 = new Composer();

step4.on("text", (ctx) => {
  console.log("Repeat Passphrase reply: ", ctx.update.message?.text);
  if (
    !newpass ||
    !ctx.update.message?.text ||
    newpass !== ctx.update.message?.text
  ) {
    ctx.reply(
      `The passwords don't match. Please try again
      
Please enter your desired new passphrase`,
      Markup.inlineKeyboard([
        [Markup.button.callback("Main Menu", "back-to-menu")],
      ])
    );
    return ctx.wizard.selectStep(2);
  }
  //TODO: CHANGE PASSCODE
  ctx.reply("Changing your passphrase...");

  return ctx.scene.leave();
});

const changePassphraseScene = new Scenes.WizardScene(
  "changePassphraseScene",
  step1,
  step2,
  step3,
  step4
);

module.exports = { changePassphraseScene };
