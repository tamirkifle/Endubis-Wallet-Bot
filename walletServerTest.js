const { WalletServer } = require("cardano-wallet-js");
let walletServer = WalletServer.init("http://localhost:8090/v2");

const information = walletServer.getNetworkInformation().then((data) => {
  console.log(data.sync_progress.status); //ready
});
