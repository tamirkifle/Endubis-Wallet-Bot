const { generateSeed } = require("../utils/generateSeed");
const { Markup } = require("telegraf");

const generateSeedHandler = (ctx) => {
  const seedPhrases = generateSeed();
  const replyWithSeedPhrases =
    "Here's your seed phrase, keep it safe: \n" + seedPhrases;
  ctx.replyWithHTML(
    replyWithSeedPhrases,
    Markup.inlineKeyboard([
      Markup.button.callback("Delete and Continue", "delete-then-restore"),
      Markup.button.callback("Keep and Continue", "restore-wallet"),
    ])
  );
};

module.exports = { generateSeedHandler };
