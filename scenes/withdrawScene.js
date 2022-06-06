const { Scenes, Composer, Markup } = require("telegraf");
const { replyMenuHTML } = require("../utils/btnMenuHelpers");
const { getADAtoETBRate } = require("../utils/currencyExchange");

const step1 = async (ctx) => {
  await replyMenuHTML(
    ctx,
    "Please select an option from the choices below",
    Markup.inlineKeyboard([
      [Markup.button.callback("🆃 Withdraw with Telebirr", "withdraw-telebirr")],
      [Markup.button.callback("↻ Pending Withdrawals", "pending-telebirr")],
      [Markup.button.callback("✅ Complete Withdrawals", "pending-telebirr")],
    ])
  );
  return ctx.wizard.next();
};

const step2 = new Composer();
step2.action("withdraw-telebirr", async (ctx) => {
  await replyMenuHTML(
    ctx,
    `Please enter the amount (in ETB or in ada) you want to withdraw.\n` +
      `<i>Examples of valid amounts: <b>50 ada</b>, <b>200 ETB</b> or <b>1000 birr</b></i>\n `
  );
  return ctx.wizard.next();
});

const step3 = new Composer();
step3.hears(/^(\d+|\d*\.\d+)\s*(birr|ada|etb)$/i, async (ctx) => {
  const amount = ctx.match[1];
  const currency = ctx.match[2].toLowerCase();
  //TODO: Calculate and add ada fees
  await replyMenuHTML(
    ctx,
    `<b>Withdrawal Summary</b>\n\n` +
      `<i>Amount to Withdraw from wallet (in ada): </i><b>${
        currency === "ada"
          ? amount
          : Math.ceil((amount / (await getADAtoETBRate())) * 100) / 100
      }</b>\n` +
      `<i>Receivable (in ETB): </i><b>${
        currency === "ada"
          ? Math.ceil(amount * (await getADAtoETBRate()))
          : amount
      }</b>`,
    {
      ...Markup.inlineKeyboard([
        //TODO: Withdrawal to frontend
        [Markup.button.url("Continue", "http://google.com")],
      ]),
      menuText: "Cancel",
    }
  );
});

step3.on("text", async (ctx) => {
  await replyMenuHTML(
    ctx,
    `Invalid entry. Please try again.\n` +
      `<i>Examples of valid amounts: <b>50 ada</b>, <b>200 ETB</b> or <b>1000 birr</b></i>`
  );
});

const withdrawScene = new Scenes.WizardScene(
  "withdrawScene",
  step1,
  step2,
  step3
);

module.exports = { withdrawScene };
