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
  "/notification",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const notification = req.body;
    console.log(req.body);
    const notificationRef = db
      .collection("notifications")
      .add(notification)
      .then(doc => {
        console.log("New notification added", doc.id);
        res.send({ success: true, message: "new notification added" });
      })
      .catch(err => {
        console.log("error creating notification", err);
        res
          .status(400)
          .send({ success: false, message: "error creating notification" });
      });
  }
);

/**
 *  @description  get all notifications by userId
 *  @route        ryoakiApp/api/v1/ryoaki-admin/notifications/:uid
 *  @param        {string} uid user reference id
 */
router.get(
  "/notifications/:uid",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const userId = req.params.uid;
    let user = null;

    const userDoc = db.collection("users").doc(userId);
    const getDoc = userDoc
      .get()
      .then(doc => {
        if (!doc.exists) {
          console.log("No such document!");
          return res.status(404).json({ message: "User not found!" });
        } else {
          if (doc.data().isDeleted) {
            console.log("user is Deleted");
            return res
              .status(404)
              .json({ message: "User not found or deleted!" });
          }
          user = doc.data();
          console.log(user);
        }

        let notificationsWithConditions = [];
        let usersNotifications = [];

        let userFlagsConditions = [];
        userFlagsConditions = Object.keys(user.userFlags).filter(
          flags => user.userFlags[flags] == true
        );

        console.log("conditions: ", userFlagsConditions);

        let notificationsRefQuery = db
          .collection("notifications")
          .where("specificReceiver", "==", "");

        userFlagsConditions.forEach(condition => {
          notificationsRefQuery = notificationsRefQuery.where(
            `receiverFlags.${condition}`,
            "==",
            true
          );
        });

        const userNotification = notificationsRefQuery
          .get()
          .then(snapshot => {
            if (snapshot.empty) {
              console.log("No matching documents.");
            } else {
              snapshot.forEach(doc => {
                notificationsWithConditions.push({
                  id: doc.id,
                  notification: doc.data()
                });
              });
              console.log(
                "Notification with conditions: ",
                notificationsWithConditions
              );
            }
            console.log("userId: ", userId);
            let usersNotificationsRef = db
              .collection("notifications")
              .where("specificReceiver", "==", userId);

            const userNotificationSpecific = usersNotificationsRef
              .get()
              .then(snapshot => {
                console.log("aaa");
                if (snapshot.empty) {
                  console.log("No matching documents.");
                } else {
                  snapshot.forEach(doc => {
                    usersNotifications.push({
                      id: doc.id,
                      notification: doc.data()
                    });
                  });
                }
                console.log("usersnotifications: ", usersNotifications);
                finalNotifications = usersNotifications.concat(
                  notificationsWithConditions
                );
                console.log("final notification:", finalNotifications);
                res.json({
                  notifications: Object.assign({}, finalNotifications)
                });
              })
              .catch(err => {});
          })
          .catch(err => {
            console.log("Error getting documents", err);
          });
      })
      .catch(err => {
        console.log("Error getting document", err);
        res.status(400).json({ error: err });
      });
  }
);

module.exports = router;
