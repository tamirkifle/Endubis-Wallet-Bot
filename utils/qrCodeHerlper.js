const {
  QRCodeStyling,
} = require("qr-code-styling-node/lib/qr-code-styling.common.js");
// const QRCode = require("qrcode");
const nodeCanvas = require("canvas");

const bot = require("../botSession");

const generateQr = (data, image = "https://svgshare.com/i/f84.svg") => {
  const obj = {
    nodeCanvas,
    width: 300,
    height: 300,
    data,
    dotsOptions: {
      color: "#033859",
      // color: "#4f4f07",
      type: "square",
    },
    cornersSquareOptions: { type: "square" },
    backgroundOptions: {
      color: "#ffedd1",
      // color: "#e9ebee",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0,
    },
  };
  if (image) {
    obj.image = image;
  }
  const qrCode = new QRCodeStyling(obj);
  return qrCode.getRawData();
};

// const generateQR = async (text) => {
//   const dataURI = await QRCode.toDataURL(text);
//   return Buffer.from(dataURI.replace("data:image/png;base64,", ""), "base64");
// };

// const getCodeFromQrCodeImageUrl = (url) => {
//   try {
//     const res = await axios.get(
//       `https://api.qrserver.com/v1/read-qr-code/?fileurl=${url}`
//     );
//     return res.data[0].symbol[0].data;
//   } catch (e) {
//     console.log(e);
//     ctx.reply("ERROR");
//   }
// };
const generateQrFileId = async (ctx, data, image) => {
  if (!ctx.session.qrCache) {
    ctx.session.qrCache = {};
  } else if (ctx.session.qrCache[data]) {
    console.log("getting from cache");
    return ctx.session.qrCache[data];
  }
  const qrBuff = await generateQr(data, image);

  const message = await bot.telegram.sendPhoto("-1001647697690", {
    source: qrBuff,
  });
  try {
    await bot.telegram.deleteMessage(message.chat.id, message.message_id);
  } catch (error) {
    console.log(error);
  }
  ctx.session.qrCache[data] = message.photo[message.photo.length - 1].file_id;
  return ctx.session.qrCache[data];
};

// const generateQrUrl = async (ctx, data, image) => {
//   const fileId = await generateQrFileId(ctx, data, image);
//   try {
//     let link = await bot.telegram.getFileLink(fileId);
//     console.log(link);
//     return link.href;
//   } catch (e) {
//     ctx.session.qrCache[data] = null;
//     const fileId = await generateQrFileId(ctx, data, image);
//     const link = await bot.telegram.getFileLink(fileId);
//     return link.href;
//   }
// };

// const replyQrFromData = async (ctx, data) => {
//   const qr = await generateQr(data);
//   return ctx.replyWithPhoto({
//     source: qr,
//   });
// };
// const replyMenuQrFromData = async (ctx, data) => {
//   const qr = await generateQr(data);
//   return ctx.replyWithPhoto({
//     source: qr,
//   });
// };

module.exports = {
  generateQrFileId,
};
