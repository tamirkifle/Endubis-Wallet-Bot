const { default: fetch } = require("cross-fetch");

const getADAtoUSDRate = async () => {
  const {
    cardano: { usd: adaToUsd },
  } = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd"
  ).then((res) => res.json());
  return adaToUsd;
};

const getUSDtoETBRate = async () => {
  const { etb: usdToEtb } = await fetch(
    "https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/etb.json"
  ).then((res) => res.json());
  return usdToEtb;
};

const getADAtoETBRate = async () => {
  const ADAtoUSD = await getADAtoUSDRate();
  const USDtoETB = await getUSDtoETBRate();

  console.log(ADAtoUSD * USDtoETB);
  return ADAtoUSD * USDtoETB;
};

module.exports = { getADAtoETBRate, getADAtoUSDRate, getUSDtoETBRate };
