const { ShelleyBaseAddressProvider } = require("./addressProvider");
const { bech32 } = require("cardano-crypto.js");
const getConfig = require("../config");
const getCryptoProvider = require("./cryptoProvider");
const fetch = require("cross-fetch");

const AddressGeneratorFactory = (cryptoProvider, type) => async (index) => {
  //type 0 for external 1 for internal
  return (await ShelleyBaseAddressProvider(cryptoProvider, 0, type)(index))
    .address;
};
const getAddressSummary = async (address) => {
  const summary = await fetch(
    `https://explorer-api.testnet.dandelion.link/api/addresses/summary/${address}`
  ).then((res) => res.json());
  const { caTxNum, caBalance, caTxList } = summary.Right;
  return {
    isUsed: caTxNum > 0,
    balance: caBalance.getCoin,
    transactions: caTxList,
  };
};

const ADDRESS_POOL_GAP = 20;
// Generate all used external addresses and ADDRESS_POOL_GAP amount of unused
const getAddressesInfo = async (accountXpub, oldAddressesInfo) => {
  let externalIndexCounter = 0,
    internalIndexCounter = 0;
  let externalAddressesInfo = [],
    internalAddressesInfo = [];

  if (oldAddressesInfo) {
    //continue from old data
    //need to check last element again because it was unused
    externalIndexCounter =
      oldAddressesInfo.externalAddressesInfo.length - ADDRESS_POOL_GAP;
    oldAddressesInfo.externalAddressesInfo.splice(externalIndexCounter);
    externalAddressesInfo = [...oldAddressesInfo.externalAddressesInfo];
    internalIndexCounter =
      oldAddressesInfo.internalAddressesInfo.length - ADDRESS_POOL_GAP;
    oldAddressesInfo.internalAddressesInfo.splice(internalIndexCounter);
    internalAddressesInfo = [...oldAddressesInfo.internalAddressesInfo];

    if (externalIndexCounter < 0) {
      externalIndexCounter = 0;
    }
    if (internalIndexCounter < 0) {
      internalIndexCounter = 0;
    }
  }
  // Decode the bech32 encoded accounXpub
  const accountXpubBuffer = bech32.decode(accountXpub).data;
  const config = getConfig();
  const cryptoProvider = await getCryptoProvider(config, accountXpubBuffer);
  const externalGenerator = AddressGeneratorFactory(cryptoProvider, 0);
  const internalGenerator = AddressGeneratorFactory(cryptoProvider, 1);

  let unusedCounter = 0;
  while (unusedCounter < ADDRESS_POOL_GAP) {
    const index = externalIndexCounter;
    const address = await externalGenerator(index);
    const summary = await getAddressSummary(address);
    if (!summary.isUsed) {
      unusedCounter++;
    } else {
      unusedCounter = 0;
    }
    externalIndexCounter++;
    externalAddressesInfo.push({
      index,
      address,
      summary,
    });
  }
  unusedCounter = 0;
  while (unusedCounter < ADDRESS_POOL_GAP) {
    const index = internalIndexCounter;
    const address = await internalGenerator(index);
    const summary = await getAddressSummary(address);
    if (!summary.isUsed) {
      unusedCounter++;
    } else {
      unusedCounter = 0;
    }
    internalIndexCounter++;
    internalAddressesInfo.push({
      index,
      address,
      summary,
    });
  }
  return { externalAddressesInfo, internalAddressesInfo };
};

module.exports = { getAddressesInfo, getAddressSummary };
