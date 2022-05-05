const { ShelleyBaseAddressProvider } = require("./addressProvider");
const { bech32 } = require("cardano-crypto.js");
const getConfig = require("../config");
const getCryptoProvider = require("./cryptoProvider");
const { writeXpubDataToSession } = require("../../firestore");
const fetch = require("cross-fetch");

const AddressGeneratorFactory = (cryptoProvider, type) => async (index) => {
  //type 0 for external 1 for internal
  return (await ShelleyBaseAddressProvider(cryptoProvider, 0, type)(index))
    .address;
};
const getAddressSummary = async (address) => {
  // const fetchWithRetries = async (
  //   url,
  //   options,
  //   retryCount = 0,
  // ) => {
  //   // split out the maxRetries option from the remaining
  //   // options (with a default of 3 retries)
  //   const { maxRetries = 3, ...remainingOptions } = options;
  //   try {
  //     return await fetch(url, remainingOptions);
  //   } catch (error) {
  //     // if the retryCount has not been exceeded, call again
  //     if (retryCount < maxRetries) {
  //       return fetchWithRetries(url, options, retryCount + 1);
  //     }
  //     // max retries exceeded
  //     throw error;
  //   }
  // }
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
const getAddressSummaries = async (addresses) => {
  const postObjectAsJsonWithRetries = async (
    url,
    object,
    maxRetries = 3,
    retryCount = 0
  ) => {
    // split out the maxRetries option from the remaining
    // options (with a default of 3 retries)
    try {
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(object),
      };
      return await fetch(url, requestOptions).then((res) => res.json());
    } catch (error) {
      // if the retryCount has not been exceeded, call again
      if (retryCount < maxRetries) {
        return postObjectAsJsonWithRetries(
          url,
          object,
          maxRetries,
          retryCount + 1
        );
      }
      // max retries exceeded
      throw error;
    }
  };
  const summary = await postObjectAsJsonWithRetries(
    `https://explorer-testnet.adalite.io/api/bulk/addresses/summary`,
    addresses
  );
  const { caBalance, caTxList } = summary.Right;
  const addressesInTxns = caTxList.reduce((acc, tx) => {
    const addrArray = tx.ctbInputs
      .map((input) => input[0])
      .concat(tx.ctbOutputs.map((output) => output[0]));
    addrArray.forEach((addr, i) => {
      if (acc.includes(addr)) {
        addrArray.splice(i, 1);
      }
    });
    return [...acc, ...addrArray];
  }, []);
  const usedAddresses = addresses.filter((address) =>
    addressesInTxns.includes(address)
  );

  return {
    usedAddresses,
    balance: caBalance.getCoin,
    transactions: caTxList,
  };
};

const ADDRESS_POOL_GAP = 20;
// Generate all used external addresses and ADDRESS_POOL_GAP amount of unused
const getAddressesInfo = async (accountXpub, sessionKey, loggedInXpub) => {
  let externalIndexCounter = 0,
    internalIndexCounter = 0;
  let externalAddressesInfo = {},
    internalAddressesInfo = {};

  // Decode the bech32 encoded accounXpub
  const accountXpubBuffer = bech32.decode(accountXpub).data;
  const config = getConfig();
  const cryptoProvider = await getCryptoProvider(config, accountXpubBuffer);
  const externalGenerator = AddressGeneratorFactory(cryptoProvider, 0);
  const internalGenerator = AddressGeneratorFactory(cryptoProvider, 1);

  const generateAddresses = async (type, startIndex, number) => {
    const addresses = [];
    if (type === 0) {
      let count = 0;
      while (count < number) {
        addresses.push(await externalGenerator(startIndex + count));
        count++;
      }
      return addresses;
    } else {
      let count = 0;
      while (count < number) {
        addresses.push(await internalGenerator(startIndex + count));
        count++;
      }
      return addresses;
    }
  };
  let conseqUnused = 0;
  while (conseqUnused < ADDRESS_POOL_GAP) {
    const startingIndex = externalIndexCounter;
    const externalAddresses = await generateAddresses(
      0,
      startingIndex,
      ADDRESS_POOL_GAP
    );
    const summaries = await getAddressSummaries(externalAddresses);
    conseqUnused = externalAddresses.reduce((acc, address) => {
      if (summaries.usedAddresses.includes(address)) {
        return 0;
      }
      return acc + 1;
    }, 0);
    externalIndexCounter += ADDRESS_POOL_GAP;
    externalAddressesInfo[
      `${startingIndex}-${startingIndex + ADDRESS_POOL_GAP - 1}`
    ] = {
      addresses: externalAddresses,
      summaries,
    };
  }
  conseqUnused = 0;
  while (conseqUnused < ADDRESS_POOL_GAP) {
    const startingIndex = internalIndexCounter;
    const internalAddresses = await generateAddresses(
      1,
      startingIndex,
      ADDRESS_POOL_GAP
    );
    const summaries = await getAddressSummaries(internalAddresses);
    conseqUnused = internalAddresses.reduce((acc, address) => {
      if (summaries.usedAddresses.includes(address)) {
        return 0;
      }
      return acc + 1;
    }, 0);
    internalIndexCounter += ADDRESS_POOL_GAP;
    internalAddressesInfo[
      `${startingIndex}-${startingIndex + ADDRESS_POOL_GAP - 1}`
    ] = {
      addresses: internalAddresses,
      summaries,
    };
  }
  const addressesInfo = { externalAddressesInfo, internalAddressesInfo };
  const totalBalance = Object.values(addressesInfo).reduce(
    (acc, value) =>
      acc +
      Object.values(value).reduce(
        (acc1, val1) => acc1 + Number(val1.summaries.balance),
        0
      ),
    0
  );
  if (sessionKey && loggedInXpub) {
    await writeXpubDataToSession(sessionKey, {
      accountXpub: loggedInXpub,
      addressesInfo,
    });
  }
  return { totalBalance, ...addressesInfo };
};

module.exports = { getAddressesInfo, getAddressSummary };
