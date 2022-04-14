const { bech32 } = require("cardano-crypto.js");
const getConfig = require("./config");
const getCryptoProvider = require("./helpers/cryptoProvider");
const { getPublicKeys } = require("./helpers/keyGenerator");

const deriveOtherKeys = async (accountXpub) => {
  // Decode the bech32 encoded accounXpub
  const accountXpubBuffer = bech32.decode(accountXpub).data;
  const config = getConfig();
  const cryptoProvider = await getCryptoProvider(config, accountXpubBuffer);
  const keys = await getPublicKeys(cryptoProvider);
  return keys;
};

module.exports = deriveOtherKeys;
