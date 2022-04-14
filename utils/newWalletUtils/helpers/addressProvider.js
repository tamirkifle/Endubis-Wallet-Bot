const {
  packBaseAddress,
  packRewardAddress,
  getPubKeyBlake2b224Hash,
  getAddressType,
  AddressTypes,
  base58,
  bech32,
  getShelleyAddressNetworkId,
} = require("cardano-crypto.js");

const HARDENED_THRESHOLD = 2147483648;

const NetworkId = {
  MAINNET: 1,
  TESTNET: 0,
};

const xpub2pub = (xpub) => xpub.slice(0, 32);

const xpub2blake2b224Hash = (xpub) => getPubKeyBlake2b224Hash(xpub2pub(xpub));

const encodeAddress = (address) => {
  const addressType = getAddressType(address);
  if (addressType === AddressTypes.BOOTSTRAP) {
    return base58.encode(address);
  }
  const addressPrefixes = {
    [AddressTypes.BASE]: "addr",
    [AddressTypes.POINTER]: "addr",
    [AddressTypes.ENTERPRISE]: "addr",
    [AddressTypes.REWARD]: "stake",
  };

  const isTestnet = getShelleyAddressNetworkId(address) === NetworkId.TESTNET;
  const addressPrefix = `${addressPrefixes[addressType]}${
    isTestnet ? "_test" : ""
  }`;
  return bech32.encode(addressPrefix, address);
};

const baseAddressFromXpub = (spendXpub, stakeXpub, networkId) => {
  const addrBuffer = packBaseAddress(
    xpub2blake2b224Hash(spendXpub),
    xpub2blake2b224Hash(stakeXpub),
    networkId
  );
  return encodeAddress(addrBuffer);
};

const stakingAddressFromXpub = (stakeXpub, networkId) => {
  const addrBuffer = packRewardAddress(
    xpub2blake2b224Hash(stakeXpub),
    networkId
  );
  return encodeAddress(addrBuffer);
};

const shelleyPath = (account, isChange, addrIdx) => {
  return [
    HARDENED_THRESHOLD + 1852,
    HARDENED_THRESHOLD + 1815,
    HARDENED_THRESHOLD + account,
    isChange ? 1 : 0,
    addrIdx,
  ];
};
const shelleyStakeAccountPath = (account) => {
  return [
    HARDENED_THRESHOLD + 1852,
    HARDENED_THRESHOLD + 1815,
    HARDENED_THRESHOLD + account,
    2, // "staking key chain"
    0,
  ];
};

const ShelleyBaseAddressProvider =
  (cryptoProvider, accountIndex, isChange) => async (i) => {
    const pathSpend = shelleyPath(accountIndex, isChange, i);
    const spendXpub = await cryptoProvider.deriveXpub(pathSpend);

    const pathStake = shelleyStakeAccountPath(accountIndex);
    const stakeXpub = await cryptoProvider.deriveXpub(pathStake);

    return {
      path: pathSpend,
      address: baseAddressFromXpub(
        spendXpub,
        stakeXpub,
        cryptoProvider.network.networkId
      ),
    };
  };

const ShelleyStakingAccountProvider =
  (cryptoProvider, accountIndex) => async () => {
    const pathStake = shelleyStakeAccountPath(accountIndex);
    const stakeXpub = await cryptoProvider.deriveXpub(pathStake);

    return {
      path: pathStake,
      address: stakingAddressFromXpub(
        stakeXpub,
        cryptoProvider.network.networkId
      ),
    };
  };
module.exports = {
  ShelleyBaseAddressProvider,
  ShelleyStakingAccountProvider,
  stakingAddressFromXpub,
};
