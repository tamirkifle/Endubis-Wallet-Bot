const { Scenes } = require("telegraf");
const { mainMenuHandler } = require("./mainMenuHandler");

const startPayloadHandler = async (ctx, next) => {
  ctx.scene?.leave();
  if (!ctx.startPayload) {
    return next();
  }
  if (ctx.startPayload === "send") {
    //switch_pm_parameter
    await ctx.deleteMessage();
    if (ctx.session?.loggedInWalletId) {
      Scenes.Stage.enter("sendScene")(ctx);
    } else {
      mainMenuHandler(ctx);
    }
  } else if (ctx.startPayload.match(/^(sendto-)(.+)/)[2]) {
    //Payment links: payload starting with "sendto-"
    console.log("Sending to ", ctx.startPayload.match(/^(sendto-)(.+)/)[2]);
    if (ctx.session?.loggedInWalletId) {
      ctx.session.toSendUserId = ctx.startPayload.match(/^(sendto-)(.+)/)[2];
      Scenes.Stage.enter("sendToUserIdScene")(ctx);
    } else {
      await ctx.reply("You are not logged in.");
      mainMenuHandler(ctx);
    }
  } else {
    //if it's not an inline-querty switch-pm and there is a payload, then it is a referral code
    //TODO: Handle Referrals
    ctx.startPayload && console.log("referral-code: " + ctx.startPayload);
  }
};

module.exports = { startPayloadHandler };
