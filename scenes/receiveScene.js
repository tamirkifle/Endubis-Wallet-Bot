const { Scenes, Composer, Markup } = require("telegraf");
const {
  mainMenuButton,
  replyMenuHTML,
  replyMenuPhoto,
} = require("../utils/btnMenuHelpers");
const {
  getReceivingAddress,
} = require("../utils/newWalletUtils/newWalletUtils");
// const { getReceivingAddress } = require("../utils/walletUtils");

const { generateQrFileId } = require("../utils/qrCodeHerlper");

// TODO: Generate QR Code

const step1 = (ctx) => {
  ctx.reply(
    "Please choose an option from the choices below",
    Markup.inlineKeyboard([
      [Markup.button.callback("Get Receiving Address", "receiving-address")],
      [Markup.button.callback("Get Receiving QR Code", "receiving-qr")],
      [mainMenuButton()],
    ])
  );
  return ctx.wizard.next();
};

const step2 = new Composer();
step2.action("receiving-address", async (ctx) => {
  const address = await getReceivingAddress(ctx.session);
  replyMenuHTML(
    ctx,
    `Any funds sent to this address will appear in your wallet.

<code>${address}</code>
`,
    Markup.inlineKeyboard([
      [Markup.button.switchToChat("Share Address", "add")],
    ])
  );
  return ctx.scene.leave();
});
step2.action("receiving-qr", async (ctx) => {
  const startPayload = Buffer.from(
    `sendto=${ctx.session.userInfo?.id}`
  ).toString("base64");
  const file_id = await generateQrFileId(
    ctx,
    `http://t.me/Testing_TM_Bot?start=${startPayload}`
  );

  await replyMenuPhoto(ctx, file_id, {
    caption: `Send to <a href="tg://user?id=${ctx.session.userInfo?.id}"><b>${
      ctx.session.userInfo?.username
        ? `@` + ctx.session.userInfo?.username + ` - `
        : ``
    }${ctx.session.userInfo?.first_name}${
      ctx.session.userInfo?.last_name
        ? ` ` + ctx.session.userInfo?.last_name
        : ``
    }</b></a>`,
    parse_mode: "HTML",
    ...Markup.inlineKeyboard([[Markup.button.switchToChat("Share", "qr")]]),
  });
  return ctx.scene.leave();
});

const receiveScene = new Scenes.WizardScene("receiveScene", step1, step2);

module.exports = { receiveScene };
