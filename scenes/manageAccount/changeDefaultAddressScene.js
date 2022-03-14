const { Scenes, Markup } = require("telegraf");
const { getWalletById, getAddresses } = require("../../utils/walletUtils");

/* 
Step 1
- List addresses in buttons and ask user to select default address
*/
const step1 = async (ctx) => {
  const wallet = await getWalletById(ctx.session.loggedInWalletId);
  const addresses = await getAddresses(wallet);
  console.log({ addresses });
  ctx.reply(
    "\nChoose a default address from one of your addresses below\n",
    Markup.inlineKeyboard(
      addresses.map((add) => [
        Markup.button.callback(String(add.id), `${String(add.id).slice(-10)}`),
      ])
    )
  );
  return ctx.wizard.next();
};

/* 
Step 2
- Change default address
*/
// const step2 = new Composer();
// step2.on("text", async (ctx) => {
//
//   return ctx.scene.leave();
// });

const changeDefaultAddressScene = new Scenes.WizardScene(
  "changeDefaultAddressScene",
  step1
  // step2
);

module.exports = { changeDefaultAddressScene };
