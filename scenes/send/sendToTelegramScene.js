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
    `Please enter the telegram username or the phone number (with country code) of the user you want to send to`
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
step2.hears(/^[a-zA-Z][a-zA-Z0-9_]{4}[a-zA-Z0-9_]*$/, async (ctx) => {
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
    await ctx.replyWithHTML(`🔴 <b>ERROR</b> \n\n${e.response.data.message}`);
    await replyMenu(
      ctx,
      `Let's try again. Please enter the telegram username or phone number of the user you want to send to`
    );
    return;
  }
});
const phoneRegex = new RegExp(
  /(\+|00)(297|93|244|1264|358|355|376|971|54|374|1684|1268|61|43|994|257|32|229|226|880|359|973|1242|387|590|375|501|1441|591|55|1246|673|975|267|236|1|61|41|56|86|225|237|243|242|682|57|269|238|506|53|5999|61|1345|357|420|49|253|1767|45|1809|1829|1849|213|593|20|291|212|34|372|251|358|679|500|33|298|691|241|44|995|44|233|350|224|590|220|245|240|30|1473|299|502|594|1671|592|852|504|385|509|36|62|44|91|246|353|98|964|354|972|39|1876|44|962|81|76|77|254|996|855|686|1869|82|383|965|856|961|231|218|1758|423|94|266|370|352|371|853|590|212|377|373|261|960|52|692|389|223|356|95|382|976|1670|258|222|1664|596|230|265|60|262|264|687|227|672|234|505|683|31|47|977|674|64|968|92|507|64|51|63|680|675|48|1787|1939|850|351|595|970|689|974|262|40|7|250|966|249|221|65|500|4779|677|232|503|378|252|508|381|211|239|597|421|386|46|268|1721|248|963|1649|235|228|66|992|690|993|670|676|1868|216|90|688|886|255|256|380|598|1|998|3906698|379|1784|58|1284|1340|84|678|681|685|967|27|260|263)(9[976]\d|8[987530]\d|6[987]\d|5[90]\d|42\d|3[875]\d|2[98654321]\d|9[8543210]|8[6421]|6[6543210]|5[87654321]|4[987654310]|3[9643210]|2[70]|7|1)\d{4,20}$/
);
step2.hears(phoneRegex, async (ctx) => {
  const inputPhoneNumber = ctx.message.text;
  const contactMsg = await ctx.telegram.sendContact(
    ctx.from.id,
    ctx.message.text,
    " "
  );
  if (!contactMsg.contact.user_id) {
    await ctx.replyWithHTML(
      `🔴 <b>ERROR</b> \n\nThis user doesn't exist in my database`
    );
    await ctx.reply(
      `Let's try again. Please enter the telegram username or phone number of the user you want to send to`
    );
    return;
  } else {
    const walletToSendTo = await getWalletByName(
      String(contactMsg.contact.user_id)
    );
    const addresses = await walletToSendTo.getUnusedAddresses();
    ctx.scene.state.receiverAddress = addresses.slice(0, 1)[0];
    await replyMenuHTML(
      ctx,
      `User with phone <a href="tg://user?id=${contactMsg.contact.user_id}">${inputPhoneNumber}</a> was found in our database.\nPlease enter the amount to send (in ada)`
    );
    return ctx.wizard.next();
  }
});
step2.on("text", async (ctx) => {
  await ctx.replyWithHTML(
    `🔴 <b>ERROR</b> \n\nThis is not a valid username or phone number`
  );
  await replyMenu(
    ctx,
    `Let's try again. Please enter the telegram username or phone number of the user you want to send to`
  );
  return;
});
const sendToTelegramScene = new Scenes.WizardScene(
  "sendToTelegramScene",
  step1,
  step2,
  ...sendCommonSteps(
    "Please enter the telegram username or phone number of the user you want to send to"
  )
);

module.exports = { sendToTelegramScene };
