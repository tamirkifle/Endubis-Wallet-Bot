/* eslint-disable node/no-missing-require */
const { db, sessionDocName } = require("../firestoreInit");

const writeXpubDataToSession = async (
  sessionKey,
  { accountXpub, addressesInfo }
) => {
  try {
    const sessionRef = db.collection(sessionDocName).doc(sessionKey);
    const sessionDataDoc = await sessionRef.get();
    if (!sessionDataDoc.exists) {
      console.log("No such user!");
      return;
    }
    const sessionData = sessionDataDoc.data();
    const loggedInXpub = accountXpub;
    await sessionRef.update({ loggedInXpub });
    const newXpubsInfo = [
      ...sessionData.XpubsInfo.filter(
        (xpubInfo) => xpubInfo.accountXpub !== accountXpub
      ),
      {
        accountXpub,
        addressesInfo,
      },
    ];
    await sessionRef.update({
      XpubsInfo: newXpubsInfo,
    });
  } catch (e) {
    console.log(e);
  }
};

const getUserXpubsInfo = async (sessionKey) => {
  const sessionRef = db.collection(sessionDocName).doc(sessionKey);
  const sessionDataDoc = await sessionRef.get();
  if (!sessionDataDoc.exists) {
    throw Error("No such user!");
  }
  const sessionData = sessionDataDoc.data();
  return sessionData.XpubsInfo;
};

const writeToSession = async (sessionKey, object) => {
  const sessionRef = db.collection(sessionDocName).doc(sessionKey);
  const sessionDataDoc = await sessionRef.get();
  if (!sessionDataDoc.exists) {
    throw Error("No such user!");
  }
  await sessionRef.update(object);
};
const checkNewUser = async (sessionKey) => {
  const userXpubsInfo = await getUserXpubsInfo(sessionKey);
  if (userXpubsInfo && userXpubsInfo.length > 0) {
    return false;
  }
  return true;
};
module.exports = {
  writeXpubDataToSession,
  checkNewUser,
  getUserXpubsInfo,
  writeToSession,
};