const { Markup } = require("telegraf");
const { getReceivingAddress } = require("../utils/newWalletUtils");
// const { getReceivingAddress } = require("../utils/walletUtils");
const { generateQrFileId } = require("../utils/qrCodeHerlper");

const sHandler = (ctx) => {
  ctx.answerInlineQuery([], {
    switch_pm_text: "Send using Endubis Wallet",
    switch_pm_parameter: "send",
  });
};
const addrHandler = async (ctx) => {
  const address = await getReceivingAddress(ctx.session);
  const results = [
    {
      type: "article",
      id: 1,
      title: "Send your receiving address",
      input_message_content: {
        message_text: `You can send to <a href="tg://user?id=${
          ctx.session.userInfo?.id
        }"><b>${
          ctx.session.userInfo?.username
            ? `@` + ctx.session.userInfo?.username + ` - `
            : ``
        }${ctx.session.userInfo?.first_name}${
          ctx.session.userInfo?.last_name
            ? ` ` + ctx.session.userInfo?.last_name
            : ``
        }</b></a> using this address. 

<code>${address}</code>`,
        parse_mode: "HTML",
      },
    },
  ];
  ctx.answerInlineQuery(results);
};
const qrHandler = async (ctx) => {
  const startPayload = Buffer.from(
    `sendto=${ctx.session.userInfo?.id}`
  ).toString("base64");
  const file_id = await generateQrFileId(
    ctx,
    `http://t.me/${ctx.botInfo.username}?start=${startPayload}`
  );

  const results = [
    {
      type: "photo",
      id: 1,
      photo_file_id: file_id,
      title: `Send a payment QR Code`,
      description:
        "Send a message with a QR Code for receiving payments to your address",
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
    },
  ];
  ctx.answerInlineQuery(results);
};

const generalInlineHandler = async (ctx) => {
  const address = await getReceivingAddress(ctx.session);
  const startPayload = Buffer.from(
    `sendto=${ctx.session.userInfo?.id}`
  ).toString("base64");
  const results = [
    {
      type: "article",
      id: 1,
      title: "Send your receiving address",
      input_message_content: {
        message_text: `Send to <a href="tg://user?id=${
          ctx.session.userInfo?.id
        }"><b>${
          ctx.session.userInfo?.username
            ? `@` + ctx.session.userInfo?.username + ` - `
            : ``
        }${ctx.session.userInfo?.first_name}${
          ctx.session.userInfo?.last_name
            ? ` ` + ctx.session.userInfo?.last_name
            : ``
        }</b></a> using this address. 

<code>${address}</code>`,
        parse_mode: "HTML",
      },
    },
    {
      type: "article",
      id: 2,
      title: "Send your receiving payment link",
      description:
        "Send a message with a link to the wallet with your contact pre-filled",
      input_message_content: {
        message_text: `Send to <a href="tg://user?id=${
          ctx.session.userInfo?.id
        }"><b>${
          ctx.session.userInfo?.username
            ? `@` + ctx.session.userInfo?.username + ` - `
            : ``
        }${ctx.session.userInfo?.first_name}${
          ctx.session.userInfo?.last_name
            ? ` ` + ctx.session.userInfo?.last_name
            : ``
        }</b></a>`,
        parse_mode: "HTML",
      },
      ...Markup.inlineKeyboard([
        [
          Markup.button.url(
            "Send",
            `http://t.me/${ctx.botInfo.username}?start=${startPayload}`
          ),
        ],
      ]),
    },
  ];
  ctx.answerInlineQuery(results);
};

const generalWithAmountHandler = async (ctx) => {
  if (Number(ctx.match[1])) {
    const amountToSend = Number(ctx.match[1]);
    const startPayload = Buffer.from(
      `sendto=${
        ctx.session.userInfo?.id
      }&amount=${amountToSend}&expiry=${Date.now()}`
    ).toString("base64");
    const address = await getReceivingAddress(ctx.session);
    const results = [
      {
        type: "article",
        id: 1,
        title: `Send your receiving address for a ${amountToSend} ada payment`,
        input_message_content: {
          message_text: `Send me <i><b>${amountToSend} ada</b></i> using this address. 
<i><b>${address}</b></i>`,
          parse_mode: "HTML",
        },
      },
      {
        type: "article",
        id: 2,
        title: `Send a ${amountToSend} ada receiving payment link`,
        description:
          "Send a message with a link to the wallet with your contact pre-filled",
        input_message_content: {
          message_text: `<a href="tg://user?id=${
            ctx.session.userInfo?.id
          }"><b>${
            ctx.session.userInfo?.username
              ? `@` + ctx.session.userInfo?.username + ` - `
              : ``
          }${ctx.session.userInfo?.first_name}${
            ctx.session.userInfo?.last_name
              ? ` ` + ctx.session.userInfo?.last_name
              : ``
          }</b></a> has requested <i><b>${amountToSend} ada</b></i>
<i>Note: The payment button below expires after one hour</i>`,
          parse_mode: "HTML",
        },
        ...Markup.inlineKeyboard([
          [
            Markup.button.url(
              `Send ${amountToSend} ada to ${
                ctx.session.userInfo?.username
                  ? `@` + ctx.session.userInfo?.username
                  : ctx.session.userInfo?.first_name
              }`,
              `http://t.me/${ctx.botInfo.username}?start=${startPayload}`
            ),
          ],
        ]),
      },
    ];
    ctx.answerInlineQuery(results, { cache_time: 0 });
  }
};
module.exports = {
  sHandler,
  qrHandler,
  addrHandler,
  generalInlineHandler,
  generalWithAmountHandler,
};
