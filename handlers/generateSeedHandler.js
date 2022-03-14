const { Markup } = require("telegraf");
const { generateSeed } = require("../utils/walletUtils");

const generateSeedHandler = (ctx) => {
  const seedPhrases = generateSeed();
  const replyWithSeedPhrases = `Here's your seed phrase, keep it safe: \n<tg-spoiler><b>${seedPhrases}</b></tg-spoiler>`;
  ctx.replyWithHTML(
    replyWithSeedPhrases,
    Markup.inlineKeyboard([
      Markup.button.callback("Delete and Continue", "delete-then-restore"),
      Markup.button.callback("Keep and Continue", "restore-wallet"),
    ])
  );
};

module.exports = { generateSeedHandler };
