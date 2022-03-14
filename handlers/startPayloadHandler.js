const { Scenes } = require("telegraf");
const { replyMenu } = require("../utils/btnMenuHelpers");
const { mainMenuHandler } = require("./mainMenuHandler");

const startPayloadHandler = async (ctx, next) => {
  ctx.scene?.leave();
  if (!ctx.startPayload) {
    return next();
  }
  const decodedPayload = Buffer.from(ctx.startPayload, "base64").toString();

  if (ctx.startPayload === "go-to-wallet") {
    //switch_pm_parameter go-to-wallet
    return mainMenuHandler(ctx);
  } else if (ctx.startPayload === "send") {
    //switch_pm_parameter send
    return Scenes.Stage.enter("sendScene")(ctx);
  } else if (decodedPayload.match(/^sendto[=-](.+)/)) {
    //matches sendto with and without amount and expiry
    if (!ctx.session.loggedInWalletId) {
      await ctx.reply("You are not logged in.");
      return mainMenuHandler(ctx);
    }
    if (
      (match = decodedPayload.match(/^sendto[=-](.+)&amount=(.+)&expiry=(.+)/))
    ) {
      ctx.session.toSendUserId = match[1];
      ctx.session.amountToSend = match[2];
      ctx.session.expiryTime = 1 * 3600000 + Number(match[3]); //1 hour expiry
    } else if ((match = decodedPayload.match(/^sendto[=-](.+)&expiry=(.+)/))) {
      ctx.session.toSendUserId = match[1];
      ctx.session.expiryTime = 1 * 3600000 + Number(match[2]); //1 hour expiry
      ctx.session.amountToSend = null;
    } else {
      match = decodedPayload.match(/^sendto[=-](.+)/);
      ctx.session.toSendUserId = match[1];
      ctx.session.expiryTime = null; //no expiry
      ctx.session.amountToSend = null;
    }
    return Scenes.Stage.enter("sendToUserIdScene")(ctx);
  } else {
    //if it's not an inline-querty switch-pm and there is a payload, then it is a referral code
    //TODO: Handle Referrals
    await replyMenu(ctx, "Invalid link!");
    return;
  }
};

module.exports = { startPayloadHandler };
