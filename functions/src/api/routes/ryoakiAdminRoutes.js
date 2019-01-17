const express = require("express");
const passport = require("passport");

const firebase = require("firebase/app");
require("firebase/firestore");

const db = firebase.firestore();

const router = express.Router();

/**
 *  @description  checks if certain receiverFlags are true and returns an array of conditions if there are any
 *  @param        {object} receiverFlags Contains all flags
 */
const isPrivateNotification = receiverFlags => {
  // TODO: check if all flags are false otherwise get all users that has the flags then  return
  let usersRef = db.collection("users");
  const usersFlagsRef = usersRef.userFlags;

  let userFlagsConditions = [];
  userFlagsConditions = Object.keys(receiverFlags).filter(
    flags => receiverFlags[flags] == true
  );

  return {
    // isPrivate: true, // this is for simulations only... logic will be here
    users: ["v2goaeA9h7gdo1De3lxkgmGM13Y2"],
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

    const {
      isPrivate,
      users,
      usersPrivateNotifed,
      conditions
    } = isPrivateNotification(req.body.receiverFlags);

    // A public Notification
    if (conditions.length === 0) {
      console.log("conditions: ", conditions);
      // No conditions met therefore a public notification
      const notificationRef = db.collection("publicNotifications");
      return notificationRef.add(notification).then(refDoc => {
        console.log("added new public notification", refDoc.id);
        res.json({ message: "New public notification added" });
      });
    }

    // if it is a private notification
    // TODO: i will loop throu all users here... only this time for sampling
    const allPrivateNotificationsRef = db.collection("allPrivateNotifications");
    const newPrivateNotification = Object.assign(notification, {
      specificReceiver: users[0]
    });

    return allPrivateNotificationsRef.add(newPrivateNotification).then(ref => {
      console.log("success fully added new private notification", ref.id);
      console.log("specificReceiver:", ref.specificReceiver);
      res.status(200).json({ message: "new private notification" });
    });
  }
);

module.exports = router;
