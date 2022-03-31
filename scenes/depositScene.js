const { Scenes, Composer, Markup } = require("telegraf");
const { replyMenuHTML } = require("../utils/btnMenuHelpers");

const step1 = (ctx) => {
  replyMenuHTML(
    ctx,
    "Please choose your deposit method from the choices below",
    Markup.inlineKeyboard([
      [Markup.button.callback("🆃 Telebirr", "deposit-telebirr")],
    ])
  );
  return ctx.wizard.next();
};

const step2 = new Composer();
step2.action("deposit-telebirr", async (ctx) => {
  replyMenuHTML(ctx, `Coming soon...`);
  return ctx.scene.leave();
});

const depositScene = new Scenes.WizardScene("depositScene", step1, step2);

module.exports = { depositScene };
