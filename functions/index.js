const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp(functions.config().firebase);

const express = require("express");
const dotenv = require("dotenv").config();
const bodyParser = require("body-parser");
const passport = require("passport");

// dotenv.config();

const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore");
require("firebase/database");
const fbConfig = require("./src/config/fbConfig");
firebase.initializeApp(fbConfig);

const userRoutes = require("./src/api/routes/userRoutes");
const uploadRoutes = require("./src/api/routes/uploadRoutes");
const ryoakiAdminRoutes = require("./src/api/routes/ryoakiAdminRoutes");
const main = express();

main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));
main.use(passport.initialize());

// Passport Config
require("./src/config/passport")(passport);
main.use("/api/v1/users", userRoutes);
main.use("/api/v1/upload", uploadRoutes);
main.use("/api/v1/ryoaki-admin", ryoakiAdminRoutes);

exports.ryoakiApp = functions.https.onRequest(main);

exports.uploadAdvertisements = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({ message: "Not Allowed" });
    }

    res.send("Its working!");
  });
});

const db = admin.firestore();

exports.syncFlagPrivateNotification = functions.firestore
  .document("allPrivateNotifications/{id}")
  .onCreate((doc, context) => {
    const notification = doc.data();
    console.log(doc);
    const specificReceiver = notification.specificReceiver;
    console.log("syncing...", specificReceiver);
    const userPrivateNotificationRef = db.collection(
      `/users/${specificReceiver}/privateNotifications`
    );
    return userPrivateNotificationRef.doc(context.params.id).set(notification);
  });

exports.addDebts = functions.https.onRequest((req, res) => {
  const lend = req.query.lend;
  return admin
    .database()
    .ref("/users")
    .push({ debts: lend })
    .then(snapshot => {
      return res.redirect(303, snapshot.ref.toString());
    });
});

exports.requestLend = functions.database
  .ref("/users/{id}/debts")
  .onCreate((snapshot, context) => {
    admin
      .database()
      .ref("/debtHistories")
      .push({
        debts: snapshot.val(),
        status: "pending",
        debtId: context.params.id
      });
    return snapshot.ref.parent.child("status").set("pending");
  });

const postDebtHistory = posting => {
  return admin
    .firestore()
    .collection("debtHistories")
    .add(posting)
    .then(doc => console.log("loan request added", doc));
};

exports.userDebts = functions.firestore
  .document("users/{id}")

  // This could be onWrite... ?
  .onUpdate((snapshot, context) => {
    const data = snapshot.after.data();
    const previousData = snapshot.before.data();

    // TODO: clean which field is being updated... this is asumptions only.
    const posting = {
      content: `${previousData.firstName} ${
        previousData.lastName
      } requested a new loan of ${data.debts}`,
      time: admin.firestore.FieldValue.serverTimestamp()
    };
    return postDebtHistory(posting);
  });
