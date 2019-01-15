const functions = require("firebase-functions");
const admin = require("firebase-admin");

const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const passport = require("passport");

dotenv.config();

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
  .onCreate(doc => {
    const notification = doc.data();
    const specificReceiver = notification.specificReceiver;
    console.log("syncing...", specificReceiver);
    const userPrivateNotificationRef = db.collection(
      `/users/${specificReceiver}/privateNotifications`
    );

    return userPrivateNotificationRef.add(notification);
  });
