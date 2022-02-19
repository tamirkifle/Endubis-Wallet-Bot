const { Telegraf, Markup, Scenes, session } = require("telegraf");
const { createAccountScene } = require("./scenes/createAccountScene.js");
const { restoreAccountScene } = require("./scenes/restoreAccountScene.js");
const { mainMenuHandler } = require("./handlers/mainMenuHandler");

require("dotenv").config();

const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);

const stage = new Scenes.Stage([createAccountScene, restoreAccountScene]);
bot.use(session());
bot.use(stage.middleware());

bot.start(mainMenuHandler);

bot.action("create-wallet", Scenes.Stage.enter("createAccountScene"));

bot.action("restore-wallet", Scenes.Stage.enter("restoreAccountScene"));

//Handles all Back to Menu clicks outside scenes
bot.action("back-to-menu", mainMenuHandler);

//THis will only activate if called outside the scene: createAccountScene, eg. if auser clicks an older message with the delete button
//So Just delete and don't try to restore the wallet
bot.action("delete-then-restore", (ctx) => {
  ctx.deleteMessage();
});

bot.launch();
