const { derivePublic: deriveChildXpub } = require("cardano-crypto.js");

const derivedXpubs = {};

const getCryptoProvider = async (
  config,
  accountXpubBuffer,
  memoKeyIdentifier
) => {
  const getType = () => "WALLET_SECRET";
  const getDerivationScheme = () => config.derivationScheme;
  const getVersion = () => null;
  function isFeatureSupported(feature) {
    return feature !== "POOL_OWNER";
  }

  const HARDENED_THRESHOLD = 2147483648;

  const indexIsHardened = (index) => index >= HARDENED_THRESHOLD;

  const deriveXpub = CachedDeriveXpubFactory(config.derivationScheme);

  function CachedDeriveXpubFactory(derivationScheme) {
    async function deriveXpub(absDerivationPath) {
      const memoKey = memoKeyIdentifier + JSON.stringify(absDerivationPath);

      if (!derivedXpubs[memoKey]) {
        const deriveHardened =
          absDerivationPath.length === 0 ||
          indexIsHardened(absDerivationPath.slice(-1)[0]);

        /*
         * we create pubKeyBulk only if the derivation path is from shelley era
         * since there should be only one byron account exported in the fist shelley pubKey bulk
         */

        if (deriveHardened) {
          return accountXpubBuffer;
        } else {
          derivedXpubs[memoKey] = await deriveXpubNonhardenedFn(
            absDerivationPath
          );
        }
      }

      /*
       * we await the derivation of the key so in case the derivation fails
       * the key is not added to the cache
       * this approach depends on the key derivation happening sychronously
       */

      return derivedXpubs[memoKey];
    }

    async function deriveXpubNonhardenedFn(derivationPath) {
      const lastIndex = derivationPath.slice(-1)[0];
      const parentXpub = await deriveXpub(derivationPath.slice(0, -1));
      return deriveChildXpub(
        parentXpub,
        lastIndex,
        derivationScheme.ed25519Mode
      );
    }

    return deriveXpub;
  }
  return {
    getType,
    getDerivationScheme,
    getVersion,
    isFeatureSupported,
    deriveXpub,
    network: config.network,
  };
};

module.exports = getCryptoProvider;
