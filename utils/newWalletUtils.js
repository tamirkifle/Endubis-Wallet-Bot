const { bech32 } = require("cardano-crypto.js");
const { WalletServer, ShelleyWallet, Seed } = require("cardano-wallet-js");
const blake = require("blakejs");
const testnetConfig = require("../testnetConfig");
const {
  getAddressesInfo,
} = require("./newWalletUtils/helpers/getAddressesInfo");

require("dotenv").config();
const walletServer = WalletServer.init(
  process.env.WALLET_SERVER_URL || "http://localhost:8090/v2"
);

const getReceivingAddress = async (session) => {
  let { loggedInXpub, XpubsInfo } = session;
  XpubsInfo = JSON.parse(XpubsInfo);
  const allAddressesInfo = XpubsInfo.find(
    (xpubInfo) => xpubInfo.accountXpub === loggedInXpub
  )?.addressesInfo;
  const { externalAddressesInfo } = allAddressesInfo;
  for (const addrInfo of Object.values(externalAddressesInfo)) {
    const unusedAddress = addrInfo.addresses.find(
      (addr) => !addrInfo.summaries.usedAddresses.includes(addr)
    );
    if (unusedAddress) {
      return unusedAddress;
    }
  }
  throw Error("Can't find unused address");
};

// const deleteWallet = async (walletId) => {};

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

const getTransactions = async (ctx) => {
  let { loggedInXpub } = ctx.session;
  const allAddressesInfo = await getAddressesInfo(
    loggedInXpub,
    `${ctx.from.id}-${ctx.chat.id}`,
    loggedInXpub
  );

  function sortTransactions(transactions) {
    let flattened = [].concat(...transactions);

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
      (a, b) => b.ctbTimeIssued - a.ctbTimeIssued
    );
    return sortedUniqueTxns;
  }

  const transactions = sortTransactions([
    ...Object.values(allAddressesInfo.externalAddressesInfo).map(
      (addrInfo) => addrInfo.summaries.transactions
    ),
    ...Object.values(allAddressesInfo.internalAddressesInfo).map(
      (addrInfo) => addrInfo.summaries.transactions
    ),
  ]);
  const myAddresses = [].concat(
    ...[
      ...Object.values(allAddressesInfo.externalAddressesInfo).map(
        (addrInfo) => addrInfo.summaries.usedAddresses
      ),
      ...Object.values(allAddressesInfo.internalAddressesInfo).map(
        (addrInfo) => addrInfo.summaries.usedAddresses
      ),
    ]
  );
  return formatTxnsToMatchCardanoWallet(transactions, myAddresses);
};

const formatTxnsToMatchCardanoWallet = (txns, myAddresses) => {
  return txns.map((txn) => {
    const myOutputs = txn.ctbOutputs.filter((output) =>
      myAddresses.includes(output[0])
    );

    const myInputs = txn.ctbInputs.filter((input) =>
      myAddresses.includes(input[0])
    );
    const myTotalOutputs = myOutputs.reduce(
      (acc, output) => acc + Number(output[1].getCoin),
      0
    );
    const myTotalInputs = myInputs.reduce(
      (acc, input) => acc + Number(input[1].getCoin),
      0
    );

    const myNet = myTotalOutputs - myTotalInputs;
    return {
      id: txn.ctbId,
      direction: myNet > 0 ? "incoming" : "outgoing",
      fee: { quantity: txn.fee },
      amount: { quantity: Math.abs(myNet) },
      inserted_at: { time: txn.ctbTimeIssued * 1000 },
      status: "in_ledger",
    };
  });
};

const getBalance = async (ctx) => {
  const { loggedInXpub } = ctx.session;

  if (!loggedInXpub) {
    throw Error("Could not get user data from session.");
  }

  const addressesInfo = await getAddressesInfo(
    loggedInXpub,
    `${ctx.from.id}-${ctx.chat.id}`,
    loggedInXpub
  );

  return addressesInfo.totalBalance;
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
    if (e.response?.data?.code === "no_such_wallet") {
      return null;
    } else {
      throw e;
    }
  }
};

const getWalletId = (bech32EncodedAccountXpub) => {
  return blake.blake2bHex(
    bech32.decode(bech32EncodedAccountXpub).data,
    null,
    20
  );
};

const getTtl = async () => {
  let info = await walletServer.getNetworkInformation();
  return info.node_tip.absolute_slot_number * 12000;
};

const buildTransaction = async (wallet, amount, receiverAddress) => {
  const ttl = await getTtl();
  const coinSelection = await wallet.getCoinSelection(
    [receiverAddress],
    [amount]
  );
  if (!coinSelection) {
    throw Error("Can not build transaction. Check the amount or address");
  }
  const opts = {
    config: testnetConfig,
  };
  try {
    return {
      transaction: Seed.buildTransaction(coinSelection, ttl, opts),
      coinSelection,
    };
  } catch (e) {
    console.error(e);
  }
};

module.exports = {
  getReceivingAddress,
  getBalance,
  getTransactions,
  createCardanoWallet,
  getWalletById,
  buildTransaction,
};
