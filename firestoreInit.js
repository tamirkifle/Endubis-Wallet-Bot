/* eslint-disable node/no-missing-require */
const firestoreSession = require("telegraf-session-firestore");

const { initializeApp } = require("firebase-admin/app");

const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

const firestoreMiddleware = (collectionName) =>
  firestoreSession(db.collection(collectionName));
const firestoreLazyMiddleware = (collectionName) =>
  firestoreSession(db.collection(collectionName), { lazy: true });

module.exports = { firestoreMiddleware, firestoreLazyMiddleware };
