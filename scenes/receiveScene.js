const { Scenes, Composer, Markup } = require("telegraf");
const { mainMenuButton, replyMenuHTML } = require("../utils/btnMenuHelpers");
const { getReceivingAddress } = require("../utils/loadAccount");

// TODO: Generate QR Code

const step1 = (ctx) => {
  ctx.reply(
    "Please choose an option from the choices below",
    Markup.inlineKeyboard([
      [Markup.button.callback("Get Receiving Address", "receiving-address")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

const step2 = new Composer();
step2.action("receiving-address", async (ctx) => {
  const address = await getReceivingAddress(ctx.session.loggedInWalletId);
  replyMenuHTML(
    ctx,
    `Any funds sent to this address will appear in your wallet.

<i><b>${address}</b></i>
`
  );
  return ctx.scene.leave();
});

const receiveScene = new Scenes.WizardScene("receiveScene", step1, step2);

module.exports = { receiveScene };
