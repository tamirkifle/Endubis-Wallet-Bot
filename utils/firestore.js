/* eslint-disable node/no-missing-require */
const { db, sessionDocName, getSessionKey } = require("../firestoreInit");

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
    let XpubsInfo;
    if (sessionData.XpubsInfo) {
      XpubsInfo = JSON.parse(sessionData.XpubsInfo);
    } else {
      XpubsInfo = [];
    }
    const loggedInXpub = accountXpub;
    await sessionRef.update({ loggedInXpub });
    const newXpubsInfo = [
      ...XpubsInfo.filter((xpubInfo) => xpubInfo.accountXpub !== accountXpub),
      {
        accountXpub,
        addressesInfo,
      },
    ];
    await sessionRef.update({
      XpubsInfo: JSON.stringify(newXpubsInfo),
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

const writeToSession = async (sessionKey, key, object) => {
  const sessionRef = db.collection(sessionDocName).doc(sessionKey);
  const sessionDataDoc = await sessionRef.get();
  if (!sessionDataDoc.exists) {
    throw Error("No such user!");
  }
  await sessionRef.update({ [key]: object });
};

const getSessionData = async (ctx) => {
  const sessionKey = getSessionKey(ctx);
  const sessionRef = db.collection(sessionDocName).doc(sessionKey);
  const sessionDataDoc = await sessionRef.get();
  if (!sessionDataDoc.exists) {
    throw Error("No such user!");
  }
  return sessionDataDoc.data();
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
  getSessionData,
};
