const NetworkId = {
  MAINNET: 1,
  TESTNET: 0,
};

const shellyDerivationScheme = {
  type: "v2",
  ed25519Mode: 2,
  keyfileVersion: "2.0.0",
};

const getConfig = (derivationScheme = shellyDerivationScheme) => ({
  isShelleyCompatible: !(derivationScheme.type === "v1"),
  network: {
    networkId: NetworkId.TESTNET,
  },
  derivationScheme,
});

module.exports = getConfig;
