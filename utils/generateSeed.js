const { Seed } = require("cardano-wallet-js");

const generateSeed = (size = 15) => {
  return Seed.generateRecoveryPhrase(size)
    .split(" ")
    .map((phrase) => `||*${phrase}*||`)
    .join(" ");
};

module.exports = { generateSeed };
