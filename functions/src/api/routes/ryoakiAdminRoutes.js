const express = require("express");
const passport = require("passport");

const firebase = require("firebase/app");
require("firebase/firestore");

const db = firebase.firestore();

const router = express.Router();

const isPrivateNotification = flags => {
  // TODO: check if all flags are false otherwise get all users that has the flags then  return
  const usersRef = db.collection("users");
  const usersFlagsRef = usersRef.userFlags;

  const usersShouldReceivePrivateNotifications = usersRef.where(
    usersFlagsRef,
    "==",
    flags
  );

  return {
    isPrivate: true, // this is for simulations only... logic will be here
    users: ["dC0pzP9KMUV7o15aWvbIlMzXb7P2"],
    usersPrivateNotifed: usersShouldReceivePrivateNotifications
  };
};

router.post(
  "/createNotification",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const notification = req.body;
    const flags = req.body.flags;
    const { isPrivate, users, usersPrivateNotifed } = isPrivateNotification(
      flags
    );

    // A public Notification
    if (!isPrivate) {
      const notificationRef = db.collection("publicNotifications");

      notificationRef.add(notification).then(refDoc => {
        console.log("added new public notification", refDoc.id);
        return res.status(200).json("New notification added");
      });
    }

    console.log("users");
    // if it is a private notification
    // TODO: i will loop throu all users here... only this time for sampling
    const allPrivateNotificationsRef = db.collection("allPrivateNotifications");
    const newPrivateNotification = Object.assign(notification, {
      specificReceiver: users[0]
    });

    allPrivateNotificationsRef
      .add(newPrivateNotification)
      .then(ref => {
        console.log("success fully added new private notification", ref.id);
        console.log("specificReceiver:", ref.specificReceiver);
        res.status(200).json({ message: "new private notification" });
      })
      .catch(error => {
        res.status(400).json("Error adding private notification", error);
      });
  }
);

module.exports = router;
