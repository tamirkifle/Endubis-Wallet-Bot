require("dotenv").config();

const { Seed } = require("cardano-wallet-js");

const { Telegraf, Markup } = require("telegraf");

const bot = new Telegraf(process.env.TG_BOT_API || "");

bot.start((ctx) => {
  ctx.reply(
    "Welcome to the Wallet Bot",
    Markup.inlineKeyboard([
      Markup.button.callback("Create New Wallet", "create-wallet"),
      Markup.button.callback(
        "Restore a Wallet with Seed Phrase",
        "restore-wallet"
      ),
    ])
  );
});

bot.action("create-wallet", (ctx) => {
  const seedPhrase =
    "Here's your seed phrase, keep it safe: \n" +
    Seed.generateRecoveryPhrase(21)
      .split(" ")
      .map((phrase) => `||*${phrase}*||`)
      .join(" ");

  ctx.reply(seedPhrase, {
    parse_mode: "MarkdownV2",
    ...Markup.inlineKeyboard([
      Markup.button.callback(
        "Delete It, I have written it down",
        "delete_message"
      ),
      Markup.button.callback(
        "Keep It Here, I don't care",
        "recover_with_phrase"
      ),
    ]),
  });
  // ctx.telegram.sendMessage(ctx.chat.id, seedPhrase, {
  //   parse_mode: "MarkdownV2",
  //   reply_markup: {
  //     inline_keyboard: [
  //       [
  //         {
  //           text: "Delete It, I have written it down",
  //           callback_data: "delete_previous",
  //         },
  //         {
  //           text: "Keep It Here, I don't care",
  //           callback_data: "recover_with_phrase",
  //         },
  //       ],
  //     ],
  //   },
  // });
});

bot.action("delete_message", (ctx) => {
  ctx.answerCbQuery();
  ctx.deleteMessage();
});

bot.action("recover_with_phrase", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    "Please enter your seed key to access your account",
    Markup.forceReply()
  );
});

bot.launch();
