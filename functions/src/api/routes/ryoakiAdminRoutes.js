const express = require("express");
const passport = require("passport");

const firebase = require("firebase/app");
require("firebase/firestore");

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

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
    const notificationRef = db.collection("notifications");
    if (!isPrivate && conditions.length === 0) {
      console.log("publi conditions: ", conditions);
      return notificationRef.add(notification).then(refDoc => {
        console.log("added new public notification", refDoc.id);
        res.json({ message: "New public notification added" });
      });
    }

    console.log("private conditions: ", conditions);
    let customquery = 'db.collection("users")';
    let usersRefQuery = db.collection("users");
    conditions.forEach(condition => {
      usersRefQuery = usersRefQuery.where(`userFlags.${condition}`, "==", true);
      customquery =
        customquery + `.where("userFlags.${condition}", "==", true)`;
    });

    usersRefQuery
      .get()
      .then(snapshots => {
        if (snapshots.empty) {
          console.log("No matching documents.");
          return res.status(404).json({ noDocument: "No matching documents" });
        }
        console.log(customquery);
        snapshots.forEach(doc => {
          console.log(doc.id, "=>", doc.data());
          const newPrivateNotification = Object.assign(notification, {
            specificReceiver: doc.id
          });

          return notificationRef
            .add(newPrivateNotification)
            .then(ref => {
              console.log(
                "success fully added new private notification",
                ref.id
              );
              return res.status(200).json({
                message: "new private notification",
                notificationId: ref.id
              });
            })
            .catch(err =>
              res.status(400).json({
                errorAddNotification:
                  "Something went wrong when adding notification",
                err
              })
            );
        });
      })
      .catch(err => {
        console.log("Error getting documents", err);
      });
  }
);

module.exports = router;
