const { Scenes, Composer } = require("telegraf");
const { replyMenu } = require("../../utils/btnMenuHelpers");
const { sendCommonSteps } = require("./sendCommonSteps");
const { getCodeFromQrCodeImageUrl } = require("../../utils/qrCodeHerlper");

const step1 = async (ctx) => {
  replyMenu(ctx, `Please send the qr code to scan`);
  return ctx.wizard.next();
};

const step2 = new Composer();
step2.on("photo", async (ctx) => {
  const qrcode = await ctx.telegram.getFileLink(
    ctx.message.photo[ctx.message.photo.length - 1].file_id
  );
  getCodeFromQrCodeImageUrl(qrcode.href);
});

const sendToQRScene = new Scenes.WizardScene(
  "sendToQRScene",
  step1,
  step2,
  ...sendCommonSteps("Please send the qr code")
);

module.exports = { sendToQRScene };
