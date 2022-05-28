const { Markup } = require("telegraf");
const express = require("express");
const app = express();
const port = 4004;
const bot = require("./botSession");
const { userIdFromSessionKey } = require("./firestoreInit");
const { writeToSession } = require("./utils/firestore");
const {
  getAddressesInfo,
} = require("./utils/newWalletUtils/helpers/getAddressesInfo");

// const Cors = require("cors")

// Middlewares
// app.use(Cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Open port
app.listen(port, () => console.log("Listening on port " + port));

// ++++++++++++++++ HTTP METHODS +++++++++++++++++++ //

app.use((req, res, next) => {
  console.log(req.body);
  next();
});
app.get("/", (req, res) => {
  res.send("Server is up and running! :D");
});
app.post("/connect", async (req, res) => {
  const { sessionKey, bech32xPub } = req.body;
  if (sessionKey && bech32xPub) {
    //TODO: remove this and get address list via api
    await getAddressesInfo(bech32xPub, sessionKey);
    //TODO: handle invalid links (hopefully on frontend)
    const userId = userIdFromSessionKey(sessionKey);
    const userInfo = await bot.telegram.getChat(userId);
    await writeToSession(sessionKey, "userInfo", userInfo);
    bot.telegram.sendMessage(
      userId,
      `🎉 You have been successfully logged in.`,
      Markup.inlineKeyboard([
        [Markup.button.callback("🏠 Go To Your Account", "back-to-menu")],
      ])
    );
  }
  res.end();
});
module.exports = app;
