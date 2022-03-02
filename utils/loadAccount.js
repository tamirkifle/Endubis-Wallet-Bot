const { Seed, WalletServer } = require("cardano-wallet-js");

let walletServer = WalletServer.init("http://localhost:8090/v2");

const loadAccountFromSeed = async (seedPhrases, passphrase, walletName) => {
  const seedArray = Seed.toMnemonicList(seedPhrases);
  const wallet = await walletServer.createOrRestoreShelleyWallet(
    walletName,
    seedArray,
    passphrase
  );
  return wallet;
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

const listWallets = async () => {
  let wallets = await walletServer.wallets();
  console.log(wallets.map((w) => w.id));
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
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const idFromSeed = async (seedPhrases) => {
  const { stdout, stderr } = await exec(
    `cd ~/Downloads/cardano-wallet-v2022-01-18-macos64; echo "${seedPhrases}" | ./cardano-address key from-recovery-phrase Shelley | ./cardano-address key public --with-chain-code | ./bech32 | xxd -r -p | b2sum -l 160 | cut -d' ' -f1`
  );
  return stdout.trim();
};

(async function () {
  listWallets();
})();

module.exports = {
  loadAccountFromSeed,
  getWalletById,
  changePassphrase,
  deleteWallet,
  walletServerInfo,
  listWallets,
  getWalletByName,
  idFromSeed,
};
