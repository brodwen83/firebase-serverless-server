const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

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
const main = express();

main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));
main.use(passport.initialize());

// Passport Config
require("./src/config/passport")(passport);
main.use("/api/v1/users", userRoutes);
main.use("/api/v1/upload", uploadRoutes);

exports.ryoakiApp = functions.https.onRequest(main);

exports.uploadAdvertisements = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    if (req.method !== "POST") {
      return res.status(500).json({ message: "Not Allowed" });
    }

    res.send("Its working!");
  });
});
