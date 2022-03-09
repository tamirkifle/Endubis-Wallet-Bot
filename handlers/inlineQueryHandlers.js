const { Markup } = require("telegraf");
const { getReceivingAddress } = require("../utils/loadAccount");

const sHandler = (ctx) => {
  const results = [];
  ctx.answerInlineQuery(results, {
    switch_pm_text: "Send using Wallet",
    switch_pm_parameter: "send",
  });
};

const generalInlineHandler = async (ctx) => {
  const address = await getReceivingAddress(ctx.session?.loggedInWalletId);
  const results = [
    {
      type: "article",
      id: 1,
      title: "Send your receiving address",
      input_message_content: {
        message_text: `Send to me using this address. 
<i><b>${address}</b></i>`,
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
        message_text: `Send to @${ctx.from.username} (${ctx.from.first_name} ${ctx.from.last_name})`,
        parse_mode: "HTML",
      },
      ...Markup.inlineKeyboard([
        [
          Markup.button.url(
            "Send",
            `http://t.me/Testing_TM_Bot?start=sendto-${ctx.from.id}`
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
    ctx.session.amountToSend = amountToSend;
    const address = await getReceivingAddress(ctx.session?.loggedInWalletId);
    const results = [
      {
        type: "article",
        id: 1,
        title: `Send your receiving address for a payment of ${amountToSend} ada`,
        input_message_content: {
          message_text: `Send me <b>${amountToSend} ada</b> using this address. 
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
          message_text: `Send ${amountToSend} ada to @${ctx.from.username} (${ctx.from.first_name} ${ctx.from.last_name})`,
          parse_mode: "HTML",
        },
        ...Markup.inlineKeyboard([
          [
            Markup.button.url(
              `Send ${amountToSend} ada to @${ctx.from.username}`,
              `http://t.me/Testing_TM_Bot?start=sendto-${ctx.from.id}&amount-${amountToSend}`
            ),
          ],
        ]),
      },
    ];
    ctx.answerInlineQuery(results);
  }
};
module.exports = { sHandler, generalInlineHandler, generalWithAmountHandler };
