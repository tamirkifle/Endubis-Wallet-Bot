const { mainMenuHandler } = require("./mainMenuHandler");

const logoutHandler = async (ctx) => {
  ctx.session = null;
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.log(error);
  }
  await mainMenuHandler(ctx);
};

module.exports = logoutHandler;
