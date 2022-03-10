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
  } else if (ctx.startPayload.match(/^sendto[=-](.+)/)[1]) {
    //sendto[=-] to support the old sendto- links
    //Payment links: payload starting with "sendto=" and could have "amount="
    if (ctx.session?.loggedInWalletId) {
      if (ctx.startPayload.match(/^sendto[=-](.+)-amount=(.+)/)) {
        ctx.session.toSendUserId = ctx.startPayload.match(
          /^sendto[=-](.+)-amount=(.+)/
        )[1];
        ctx.session.amountToSend = ctx.startPayload.match(
          /^sendto[=-](.+)-amount=(.+)/
        )[2];
      } else {
        ctx.session.toSendUserId = ctx.startPayload.match(/^sendto[=-](.+)/)[1];
        ctx.session.amountToSend = null;
      }
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
