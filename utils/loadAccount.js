const { Seed, WalletServer } = require("cardano-wallet-js");

let walletServer = WalletServer.init("http://localhost:8090/v2");

const loadAccountFromSeed = async (seedPhrases, passphrase, walletName) => {
  const seedArray = Seed.toMnemonicList(seedPhrases);
  try {
    const wallet = await walletServer.createOrRestoreShelleyWallet(
      walletName,
      seedArray,
      passphrase
    );
    return wallet;
  } catch (e) {
    if (e.response.data.code === "wallet_already_exists") {
      console.log("Wallet Already Exists");

      //TODO: Find a Better way of getting the walletID from a seed phrase with an already exisiting wallet
      const existingWalletId = JSON.stringify(e.response.data.message)
        .split("id: ")[1]
        .split(" However")[0];
      const existingWallet = await getWalletById(existingWalletId);
      return existingWallet;
    } else {
      throw e;
    }
  }
};

const getWalletById = async (walletId) => {
  const wallet = walletServer.getShelleyWallet(walletId);
  return wallet;
};

const getWalletByName = async (walletName) => {
  let wallets = await walletServer.wallets();
  let foundWallet = wallets.find((wallet) => wallet.name === walletName);
  return foundWallet;
};

const formatWalletData = (wallet) => {
  console.log(wallet);
  return `Here's your wallet information: 

Wallet Name: ${wallet.name}
Wallet Total Balance: ${wallet.balance.total.quantity / 1000000} ADA
Wallet Available Balance: ${wallet.balance.available.quantity / 1000000} ADA
`;
};

const listWallets = async () => {
  let wallets = await walletServer.wallets();
  console.log(wallets);
  let addresses = await wallets[0].getAddresses();
  // console.log(addresses[0]);
};

const getTransactions = async (wallet) => {
  let transactions = await wallet.getTransactions();
  return transactions;
};
//account-1
// loadAccountFromSeed(
//   "celery trumpet decade draft naive nature antique novel topple slice celery gas fossil transfer wash",
//   "passwordistooshort",
//   "test-wallet"
// );

//account-2
// loadAccountFromSeed(
//   "exercise cycle law pig success shaft ship ripple second pave slab card cotton lens eight",
//   "passwordistamir",
//   "tamir-test-wallet"
// );

(async function () {
  // console.log(await getWalletByName("test-wallet"));
})();

module.exports = { loadAccountFromSeed, formatWalletData };
