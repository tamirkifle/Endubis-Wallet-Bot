const { Scenes } = require("telegraf");

const startPayloadHandler = async (ctx, next) => {
  switch (ctx.startPayload) {
    case "send": //switch_pm_parameter
      await ctx.deleteMessage();
      if (ctx.session?.loggedInWalletId) {
        Scenes.Stage.enter("sendScene")(ctx);
      } else {
        mainMenuHandler(ctx);
      }
      break;
    default:
      //if it's not an inline-querty switch-pm and there is a payload, then it is a referral code
      //TODO: Handle Referrals
      ctx.startPayload && console.log("referral-code: " + ctx.startPayload);
      next();
  }
};

module.exports = { startPayloadHandler };
