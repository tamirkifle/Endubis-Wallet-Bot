const { Scenes, Markup, Composer } = require("telegraf");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");
const { changePassphrase } = require("../../utils/loadAccount");
const { replyMenu } = require("../../utils/replyWithMenu");

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
  replyMenu(ctx, `Please enter your old passphrase to get started`);
  return ctx.wizard.next();
};

/*
Step 2:
- Validate old passphrase
- Ask for new Passphrase
*/
let oldPass;
const step2 = new Composer();
step2.on("text", (ctx) => {
  if (ctx.update.message?.text.length < 10) {
    replyMenu(
      ctx,
      "Passphrase can't be less than 10 characters long. Try again."
    );
    return;
  }
  oldPass = ctx.update.message?.text;
  replyMenu(ctx, `Please enter your desired new passphrase`);
  return ctx.wizard.next();
  // return ctx.scene.leave();
});

/*
Step 3:
- Validate new passphrase
- Ask user to repeat the new Passphrase
*/

const step3 = new Composer();
let newPass;
step3.on("text", (ctx) => {
  console.log("New Passphrase reply: ", ctx.update.message?.text);
  newPass = ctx.update.message?.text;
  if (ctx.update.message?.text.length < 10) {
    replyMenu(
      ctx,
      "Passphrase can't be less than 10 characters long. Try again."
    );
    return;
  }
  replyMenu(ctx, `Please repeat the new passphrase`);
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

step4.on("text", async (ctx) => {
  console.log("Repeat Passphrase reply: ", ctx.update.message?.text);
  if (
    !newPass ||
    !ctx.update.message?.text ||
    newPass !== ctx.update.message?.text
  ) {
    replyMenu(
      ctx,
      `The passwords don't match. Please try again.\n\nEnter your desired new passphrase`
    );
    return ctx.wizard.selectStep(2);
  }
  ctx.reply("Changing your passphrase...");
  try {
    const result = await changePassphrase(
      ctx.session?.loggedInWalletId,
      oldPass,
      newPass
    );
    replyMenu(ctx, "Passphrase was successfully changed");
  } catch (e) {
    replyMenu(ctx, `🔴 ERROR: \n${e.response.data.message.split(":")[0]}`);
  }

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
