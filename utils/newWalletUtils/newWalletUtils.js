const { getAddressSummary } = require("./helpers/getAddressesInfo");
const { bech32 } = require("cardano-crypto.js");
const { WalletServer, ShelleyWallet } = require("cardano-wallet-js");
const blake2 = require("blake2");

require("dotenv").config();
const walletServer = WalletServer.init(
  process.env.WALLET_SERVER_URL || "http://localhost:8090/v2"
);

const getReceivingAddress = async (session) => {
  const { loggedInXpub, XpubsInfo } = session;
  const allAddressesInfo = XpubsInfo.find(
    (xpubInfo) => xpubInfo.accountXpub === loggedInXpub
  )?.addressesInfo;
  const { externalAddressesInfo } = allAddressesInfo;
  const allUnusedAddresses = externalAddressesInfo
    .filter((addrInfo) => !addrInfo.isUsed)
    .map((addrInfo) => addrInfo.address);
  for (let index = 0; index < allUnusedAddresses.length; index++) {
    const { isUsed } = await getAddressSummary(allUnusedAddresses[index]);
    if (isUsed) {
      index++;
    } else {
      return allUnusedAddresses[index];
    }
  }
};

const deleteWallet = async (walletId) => {};

// const txnformat = {
//   id: "id",
//   direction: "incoming" | "outgoing",
//   fee: { quantity: "" },
//   amount: { quantity: "" },
//   inserted_at: { time: "" },
//   expires_at: { time: "" },
//   pending_sincet: { time: "" },
//   status: "in_ledger" | "pending",
// };

const getTransactions = async (session) => {
  const { loggedInXpub, XpubsInfo } = session;
  const allAddressesInfo = XpubsInfo.find(
    (xpubInfo) => xpubInfo.accountXpub === loggedInXpub
  )?.addressesInfo;

  function sortTransactions(transactions) {
    let flattened = [];
    transactions.forEach((txns) => txns.forEach((txn) => flattened.push(txn)));
    /*
    Txns repeat when you use multiple addresses for 
    utxos and/or when you have change from a utxo used 
    and its returned to another address(usu. internal address).
     */
    const uniqueIds = [];
    const repeatTxnAddresses = [];
    const uniqueTxns = flattened.filter((txn) => {
      if (uniqueIds.includes(txn.ctbId)) {
        repeatTxnAddresses.push(txn.ctbId);
        return false;
      }
      uniqueIds.push(txn.ctbId);
      return true;
    });
    // const flatAddrArray = uniqueTxns.map((txn) => {
    //   const ctaOutputAddresses = txn.ctbOutputs
    //     .filter((output) => repeatTxnAddresses.includes(output.ctaAddress))
    //     .map((outputs) => outputs.ctaAddress);
    //   const ctaInputAddresses = txn.ctbInputs
    //     .filter((input) => repeatTxnAddresses.includes(input.ctaAddress))
    //     .map((inputs) => inputs.ctaAddress);
    //   return {
    //     ...txn,
    //     caAddress: [txn.caAddress, ...ctaOutputAddresses, ...ctaInputAddresses],
    //   };
    // });

    const sortedUniqueTxns = uniqueTxns.sort(
      (a, b) => a.ctbTimeIssued - b.ctbTimeIssued
    );
    return sortedUniqueTxns;
  }

  const transactions = sortTransactions([
    ...allAddressesInfo.externalAddressesInfo.map(
      (addrInfo) => addrInfo.summary.transactions
    ),
    ...allAddressesInfo.internalAddressesInfo.map(
      (addrInfo) => addrInfo.summary.transactions
    ),
  ]);
  const myAddresses = [
    ...allAddressesInfo.externalAddressesInfo.map(
      (addrInfo) => addrInfo.address
    ),
    ...allAddressesInfo.internalAddressesInfo.map(
      (addrInfo) => addrInfo.address
    ),
  ];
  return formatTxnsToMatchCardanoWallet(transactions, myAddresses);
};

const formatTxnsToMatchCardanoWallet = (txns, myAddresses) => {
  return txns.map((txn) => {
    const myOutputs = txn.ctbOutputs.filter((output) =>
      myAddresses.includes(output.ctaAddress)
    );

    const myInputs = txn.ctbInputs.filter((input) =>
      myAddresses.includes(input.ctaAddress)
    );
    const myTotalOutputs = myOutputs.reduce(
      (acc, output) => acc + Number(output.ctaAmount.getCoin),
      0
    );
    const myTotalInputs = myInputs.reduce(
      (acc, input) => acc + Number(input.ctaAmount.getCoin),
      0
    );

    const myNet = myTotalOutputs - myTotalInputs;
    return {
      id: txn.ctbId,
      direction: myNet > 0 ? "incoming" : "outgoing",
      fee: { quantity: txn.ctbFees.getCoin },
      amount: { quantity: Math.abs(myNet) },
      inserted_at: { time: txn.ctbTimeIssued * 1000 },
      status: "in_ledger",
    };
  });
};

const getBalanceFromSession = async (session) => {
  const { loggedInXpub, XpubsInfo } = session;
  if (!loggedInXpub || !XpubsInfo) {
    throw Error("Could not get user data from session.");
  }
  const allAddressesInfo = XpubsInfo.find(
    (xpubInfo) => xpubInfo.accountXpub === loggedInXpub
  )?.addressesInfo;
  if (!allAddressesInfo) {
    throw Error("Could not get user addresses info from session.");
  }
  allAddressesInfo;
  const balance = [
    ...allAddressesInfo.externalAddressesInfo,
    ...allAddressesInfo.internalAddressesInfo,
  ].reduce((acc, addrInfo) => acc + Number(addrInfo.summary.balance), 0);

  return balance;
};

const createCardanoWallet = async (bech32EncodedAccountXpub, walletName) => {
  const payload = {
    name: walletName,
    account_public_key: bech32
      .decode(bech32EncodedAccountXpub)
      .data.toString("hex"),
  };
  try {
    const res = await walletServer.walletsApi.postWallet(payload);
    const apiWallet = res.data;
    return ShelleyWallet.from(apiWallet, this.config);
  } catch (e) {
    if (e?.response?.data?.code === "wallet_already_exists") {
      return walletServer.getShelleyWallet(
        getWalletId(bech32EncodedAccountXpub)
      );
    } else {
      throw e;
    }
  }
};

const getWalletById = async (walletId) => {
  try {
    const wallet = await walletServer.getShelleyWallet(walletId);
    return wallet;
  } catch (e) {
    if (e.response.data.code === "no_such_wallet") {
      return null;
    } else {
      throw e;
    }
  }
};

const getWalletId = (bech32EncodedAccountXpub) => {
  const h = blake2.createHash("blake2b", { digestLength: 20 });
  h.update(bech32.decode(bech32EncodedAccountXpub).data);
  return h.digest("hex");
};

// console.log(
//   blake2b(
//     bech32.decode(
//       "endbs13qvpmh86s57alus497hjlxamamqtlylq7xq8kkxdvnvvgnd6hmdz6hp482mrkk65jdxjnuelu5ushq9vnrpv085vqzegth7uc5zujwcsggfnk"
//     ).data,
//     160
//   )
// );

console.log();

module.exports = {
  deleteWallet,
  getReceivingAddress,
  getBalanceFromSession,
  getTransactions,
  createCardanoWallet,
  getWalletById,
};
