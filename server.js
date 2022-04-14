const express = require("express");
const app = express();
const port = 4004;
const bot = require("./botSession");
const deriveOtherKeys = require("./utils/newWalletUtils/deriveOtherKeys");

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
  /*TODO:
    - Validate req.body check bech32 account key
    - derive account -> external pub key to derive unused addresses
    - derive account -> stake pub key to derive stake key
    - save userId: XPub, changeXpub, stakeXpub in a file or a db
    - write new generateUnusedAddr
    - write new getBalance fn
    - send user message that he has successfully logged in
  */

  const { userId, bech32xPub } = req.body;
  if (userId && bech32xPub) {
    const keys = await deriveOtherKeys(bech32xPub);
    console.log(keys);
    // await saveAccountDataToSession(keys);
    userId &&
      bot.telegram.sendMessage(
        userId,
        `🎉 You have been successfully logged in.`
      );
  }
  res.end();
});
module.exports = app;
