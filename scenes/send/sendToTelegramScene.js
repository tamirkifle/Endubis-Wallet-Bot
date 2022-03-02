const { Scenes, Composer, Telegraf } = require("telegraf");
const { listWallets, getWalletByName } = require("../../utils/loadAccount");
const { replyMenu, replyMenuHTML } = require("../../utils/btnMenuHelpers");
const { sendCommonSteps } = require("./sendCommonSteps");

require("dotenv").config();
const token = process.env.TG_BOT_TOKEN;
if (token === undefined) {
  throw new Error("TG_BOT_TOKEN must be provided!");
}

const bot = new Telegraf(token);
/* 
Step 1
- Ask for telegram username
*/
const step1 = async (ctx) => {
  replyMenu(
    ctx,
    `Please enter the telegram username of the user you want to send to`
  );
  return ctx.wizard.next();
};

/* 
Step 2
- Check if user is in your wallet database
  - If in database
    - Ask for amount to send
  - If not in database
    - Show message 'This user is not registered in our wallet bot'

*/
const step2 = new Composer();
step2.on("text", async (ctx) => {
  let username = ctx.message.text;
  username = username.match(/^(@)(.*)/)
    ? username.match(/^@(.*)/)[1]
    : username; //if there is an @ in front, remove it.

  let chats = (await listWallets())
    .map((wallet) => wallet.name)
    .map((chat_id) => bot.telegram.getChat(chat_id));
  try {
    chats = await Promise.all(chats);
    console.log({ chats });
    const toSendChat = chats.find((chat) => chat.username === username);
    if (!toSendChat) {
      throw {
        response: {
          data: { message: "Username doesn't exist in my database" },
        },
      };
    }
    const toSendId = (await toSendChat).id;
    const walletToSendTo = await getWalletByName(String(toSendId));
    const addresses = await walletToSendTo.getUnusedAddresses();
    ctx.scene.state.receiverAddress = addresses.slice(0, 1)[0];
    await replyMenuHTML(
      ctx,
      `Username <a href="tg://user?id=${toSendId}">@${username}</a> was found in our database.\nPlease enter the amount to send (in ada)`
    );
    return ctx.wizard.next();
  } catch (e) {
    await replyMenuHTML(ctx, `🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
    await replyMenu(
      ctx,
      `Let's try again. Please enter the telegram username of the user you want to send to`
    );
    return;
  }
});

const sendToTelegramScene = new Scenes.WizardScene(
  "sendToTelegramScene",
  step1,
  step2,
  ...sendCommonSteps(
    "Please enter the telegram username of the user you want to send to"
  )
);

module.exports = { sendToTelegramScene };
