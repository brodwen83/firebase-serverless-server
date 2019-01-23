const express = require("express");
const passport = require("passport");

const firebase = require("firebase/app");
require("firebase/firestore");

const db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });

const router = express.Router();

/**
 *  @description  creates a notification
 *  @route        POST /ryoakiApp/api/v1/ryoaki-admin/notification
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
                res.status(400).send({
                    success: false,
                    message: "error creating notification"
                });
            });
    }
);

/**
 *  @description  update notification by id
 *  @route        POST /ryoakiApp/api/v1/ryoaki-admin/notification/:id
 *  @param        {string} id request parameter id
 */
router.patch(
    "/notification/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        const notificationDocRef = db
            .collection("notifications")
            .doc(req.params.id)
            .set(req.body)
            .then(ref => {
                console.log("update successful");
                res.send({ success: true, message: "successfuly updated" });
            })
            .catch(err => {
                console.log("error updating notification", err);
                res.status(400).send({
                    success: false,
                    message: "error updating document",
                    err
                });
            });
    }
);

/**
 *  @description  get notification by id
 *  @route        GET /ryoakiApp/api/v1/ryoaki-admin/notification/:id
 *  @param        {string} id request parameter id
 */
router.get(
    "/notification/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        const notificationDocRef = db
            .collection("notifications")
            .doc(req.params.id)
            .get()
            .then(doc => {
                if (!doc.exists) {
                    console.log("No such document", req.params.id);
                    return res
                        .status(404)
                        .json({ success: false, message: "No such document" });
                }

                if (doc.data().isDeleted) {
                    console.log("deleted document", req.params.id);
                    return res.status(404).json({
                        success: false,
                        message: "No such document or it is being deleted"
                    });
                }

                res.send({ id: doc.id, notification: doc.data() });
            })
            .catch(err => {
                console.log("Get notification error", err);
                res.status(400).json({
                    success: false,
                    message: "Error getting notification with that id"
                });
            });
    }
);

/**
 *  @description  Get all notifications
 *  @route        GET /ryoakiApp/api/v1/ryoaki-admin/notifications
 *  @returns      {Object} notifications
 */
router.get(
    "/notifications",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        const allNotifications = [];
        const notificationRef = db
            .collection("notifications")
            .get()
            .then(snapshot => {
                if (snapshot.empty) {
                    console.log("No notifications");
                    return res
                        .status(404)
                        .json({ success: false, message: "No notification" });
                }
                snapshot.forEach(doc => {
                    allNotifications.push({
                        id: doc.id,
                        notification: doc.data()
                    });
                });

                res.send({
                    notifications: Object.assign({}, allNotifications)
                });
            })
            .catch(err => {
                res.send(400).send({
                    success: false,
                    message: "error getting notifications"
                });
            });
    }
);

/**
 *  @description  Get all notifications list by userId
 *  @route        GET /ryoakiApp/api/v1/ryoaki-admin/notifications/:uid
 *  @param        {string} uid user reference id
 *  @returns      {Object} notifications
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
                }

                if (doc.data().isDeleted) {
                    console.log("user is Deleted");
                    return res
                        .status(404)
                        .json({ message: "User not found or deleted!" });
                }

                user = doc.data();
                console.log(user);

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
                                console.log(
                                    "usersnotifications: ",
                                    usersNotifications
                                );
                                finalNotifications = usersNotifications.concat(
                                    notificationsWithConditions
                                );
                                console.log(
                                    "final notification:",
                                    finalNotifications
                                );
                                res.json({
                                    notifications: Object.assign(
                                        {},
                                        finalNotifications
                                    )
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
