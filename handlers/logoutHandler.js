const { mainMenuHandler } = require("./mainMenuHandler");

const logoutHandler = async (ctx) => {
  ctx.session = null;
  await mainMenuHandler(ctx);
};

module.exports = logoutHandler;
