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
Feel free to use <a href="http://t.me/Testing_TM_Bot?start=${ctx.session?.loggedInWalletId}">Endubis Testing Wallet</a>:
<i><b>${address}</b></i>`,
        parse_mode: "HTML",
      },
    },
  ];
  ctx.answerInlineQuery(results);
};
module.exports = { sHandler, generalInlineHandler };
