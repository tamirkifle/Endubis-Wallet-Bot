const { Scenes, Composer, Markup } = require("telegraf");
const {
  mainMenuButton,
  replyMenuHTML,
  replyMenu,
} = require("../utils/btnMenuHelpers");
const { getWalletById } = require("../utils/loadAccount");

const step1 = (ctx) => {
  ctx.reply(
    "Please choose an option from the choices below",
    Markup.inlineKeyboard([
      [Markup.button.callback("Send to a Cardano address", "send-addr")],
      [
        Markup.button.callback(
          "IN CONSTRUCTION: Send to a Telegram user",
          "send-tg-user"
        ),
      ],
      [
        Markup.button.callback(
          "IN CONSTRUCTION: Send using a QR Code",
          "send-qr-code"
        ),
      ],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

/* 
  Step 2
  - Ask for address
*/

const step2 = new Composer();
step2.action("send-addr", Scenes.Stage.enter("sendToAddressScene"));

const sendScene = new Scenes.WizardScene("sendScene", step1, step2);

module.exports = { sendScene };
