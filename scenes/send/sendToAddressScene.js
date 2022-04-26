const { Scenes, Composer } = require("telegraf");
const { replyMenu } = require("../../utils/btnMenuHelpers");
const { AddressWallet } = require("cardano-wallet-js");
const { sendCommonSteps } = require("./sendCommonSteps");
const { mainMenuHandler } = require("../../handlers/mainMenuHandler");

/* 
Step 1
- Ask for address
*/
const step1 = async (ctx) => {
  replyMenu(ctx, `Please enter the address you want to send to`);
  return ctx.wizard.next();
};

/* 
Step 2
- TODO: Validate address
- Ask for amount to send

*/

const step2 = new Composer();
step2.start(mainMenuHandler);
step2.hears("🏠 Main Menu", mainMenuHandler);

step2.on("text", async (ctx) => {
  //TODO: Validate address
  console.log("here");
  const addrToSendTo = ctx.message?.text;
  ctx.scene.state.receiverAddress = JSON.parse(
    JSON.stringify(new AddressWallet(addrToSendTo))
  );
  replyMenu(ctx, "Please enter the amount to send (in ada)");
  return ctx.wizard.next();
});

const sendToAddressScene = new Scenes.WizardScene(
  "sendToAddressScene",
  step1,
  step2,
  ...sendCommonSteps("Please enter the address to send to")
);

module.exports = { sendToAddressScene };
