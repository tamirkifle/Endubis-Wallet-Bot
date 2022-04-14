const { bech32 } = require("cardano-crypto.js");
const { stakingAddressFromXpub } = require("./addressProvider");

const HARDENED_THRESHOLD = 2147483648;
const NetworkId = {
  MAINNET: 1,
  TESTNET: 0,
};
const getPublicKeys = async (cryptoProvider, accountIndex = 0) => {
  const externalPath = [
    HARDENED_THRESHOLD + 1852,
    HARDENED_THRESHOLD + 1815,
    HARDENED_THRESHOLD + accountIndex,
    0,
  ];
  const internalPath = [
    HARDENED_THRESHOLD + 1852,
    HARDENED_THRESHOLD + 1815,
    HARDENED_THRESHOLD + accountIndex,
    0,
  ];
  const stakePath = [
    HARDENED_THRESHOLD + 1852,
    HARDENED_THRESHOLD + 1815,
    HARDENED_THRESHOLD + accountIndex,
    2,
    0,
  ];
  const externalXpub = await cryptoProvider.deriveXpub(externalPath);
  const internalXpub = await cryptoProvider.deriveXpub(internalPath);
  const stakeXpub = await cryptoProvider.deriveXpub(stakePath);
  return {
    extenalXpub: bech32.encode("endbs", externalXpub),
    internalXpub: bech32.encode("endbs", internalXpub),
    stakeKey: stakingAddressFromXpub(stakeXpub, NetworkId.TESTNET),
  };
};

module.exports = { getPublicKeys };
