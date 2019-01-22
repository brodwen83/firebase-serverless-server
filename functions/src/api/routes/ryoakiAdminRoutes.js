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
      return notificationRef
        .add(notification)
        .then(refDoc => {
          console.log("added new public notification", refDoc.id);
          res.json({ message: "New public notification added" });
        })
        .catch(error => {
          res
            .status(400)
            .json({ message: "Error creating public notification", error });
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

          notificationRef
            .add(newPrivateNotification)
            .then(ref => {
              console.log(
                "success fully added new private notification",
                ref.id
              );
              res.status(200).json({
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

/**
 *  @description  get all notifications by userId
 *  @route        ryoakiApp/api/v1/ryoaki-admin/notifications/:uid
 *  @param        {string} uid user reference id
 */
router.get(
  "/list-notifications/:uid",
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
                notificationsWithConditions.push(doc.data());
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
                    usersNotifications.push(doc.data());
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
        // res.status(400).json({ error: err });
      });
  }
);

module.exports = router;
