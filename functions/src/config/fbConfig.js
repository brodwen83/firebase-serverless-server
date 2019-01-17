const functions = require("firebase-functions");

const ryoakiKeys = functions.config().ryoaki;

// var fbConfig = {
//   apiKey: process.env.FIREBASE_API,
//   authDomain: process.env.FIREBASE_AUTH_DOMAIN,
//   databaseURL: process.env.FIREBASE_DATABASE_URL,
//   projectId: process.env.FIREBASE_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
// };

// deploy to cloud
const fbConfig = {
  apiKey: ryoakiKeys.api,
  authDomain: ryoakiKeys.authdomain,
  databaseURL: ryoakiKeys.databaseurl,
  projectId: ryoakiKeys.projectid,
  storageBucket: ryoakiKeys.storagebucket,
  messagingSenderId: ryoakiKeys.messagingsenderid
};

module.exports = fbConfig;
