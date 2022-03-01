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
  return `Hey there. Here's your wallet information:

Wallet Total Balance: ${wallet.balance.total.quantity / 1000000} ADA
Wallet Available Balance: ${wallet.balance.available.quantity / 1000000} ADA
`;
};

const listWallets = async () => {
  let wallets = await walletServer.wallets();
  // const mywallet = await getWalletByName("tamirk");
  // console.log((await mywallet.getUnusedAddresses()).slice(0, 1));
  return wallets;
};

const getAddresses = async (wallet) => {
  const addresses = await wallet.getAddresses();

  return addresses;
};

const getTransactions = async (wallet) => {
  const transactions = await wallet.getTransactions();
  return transactions;
};

const changePassphrase = async (walletId, oldPassphrase, newPassphrase) => {
  const wallet = await getWalletById(walletId);
  const result = await wallet.updatePassphrase(oldPassphrase, newPassphrase);
  return result;
};

const deleteWallet = async (walletId) => {
  const wallet = await getWalletById(walletId);
  const result = await wallet.delete();
  return result;
};

const walletServerInfo = async () => {
  return walletServer.getNetworkInformation();
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

(function () {
  listWallets();
})();

module.exports = {
  loadAccountFromSeed,
  formatWalletData,
  getWalletById,
  changePassphrase,
  deleteWallet,
  walletServerInfo,
};
