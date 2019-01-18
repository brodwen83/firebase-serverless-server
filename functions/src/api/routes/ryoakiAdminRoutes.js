const express = require("express");
const passport = require("passport");

const firebase = require("firebase/app");
require("firebase/firestore");

const db = firebase.firestore();

const router = express.Router();

/**
 *  @description  checks if certain receiverFlags are true and returns an array of conditions if there are any
 *  @param        {object} receiverFlags Contains all flags
 *  @returns      {object} isPrivate, conditions
 */
const isPrivateNotification = receiverFlags => {
  let userFlagsConditions = [];
  userFlagsConditions = Object.keys(receiverFlags).filter(
    flags => receiverFlags[flags] == true
  );

  return {
    isPrivate: userFlagsConditions.length !== 0 ? true : false,
    conditions: userFlagsConditions
  };
};

/**
 *  @description  creates a notification / private notification if falls on some flags conditions
 *  @route        ryoakiApp/api/v1/ryoaki-admin/createNotification
 *  @param        {object} notification Contains text and flags
 */
router.post(
  "/createNotification",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const notification = req.body;
    console.log(req.body);
    const { isPrivate, conditions } = isPrivateNotification(
      req.body.receiverFlags
    );

    // A public Notification
    if (!isPrivate && conditions.length === 0) {
      console.log("publi conditions: ", conditions);
      // No conditions met therefore a public notification
      const notificationRef = db.collection("publicNotifications");
      return notificationRef.add(notification).then(refDoc => {
        console.log("added new public notification", refDoc.id);
        res.json({ message: "New public notification added" });
      });
    }

    console.log("private conditions: ", conditions);
    let usersRefQuery = db.collection("users");

    conditions.forEach(condition => {
      usersRefQuery = usersRefQuery.where(`userFlags.${condition}`, "==", true);
    });

    const allPrivateNotificationsRef = db.collection("allPrivateNotifications");

    usersRefQuery
      .get()
      .then(snapshots => {
        if (snapshots.empty) {
          console.log("No matching documents.");
          return res.status(404).json({ noDocument: "No matching documents" });
        }

        snapshots.forEach(async doc => {
          const newPrivateNotification = Object.assign(notification, {
            specificReceiver: doc.id
          });

          const ref = await allPrivateNotificationsRef.add(
            newPrivateNotification
          );
          console.log("success fully added new private notification", ref.id);
          console.log("specificReceiver:", ref.specificReceiver);
          res.status(200).json({ message: "new private notification" });
        });
      })
      .catch(err => {
        console.log("Error getting documents", err);
      });
  }
);

module.exports = router;
