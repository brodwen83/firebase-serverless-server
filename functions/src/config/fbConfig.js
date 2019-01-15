const functions = require("firebase-functions");

const ryoakiKeys = functions.config().ryoaki;

const fbConfig = {
  apiKey: ryoakiKeys.api,
  authDomain: ryoakiKeys.authdomain,
  databaseURL: ryoakiKeys.databaseurl,
  projectId: ryoakiKeys.projectid,
  storageBucket: ryoakiKeys.storagebucket,
  messagingSenderId: ryoakiKeys.messagingsenderid
};

module.exports = fbConfig;
