const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const firebase = require("firebase");
const passport = require("passport");

const appAuth = firebase.auth();
const appFirestore = firebase.firestore();

const validateRegistration = require("../../validations/register");
const validateLogin = require("../../validations/login");

const createCustomToken = payload => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });
};

/**
 *  @route        GET /auth/login
 *  @description  Login User / Returning JWT Token
 *  @access       Public
 */
router.post("/login", (req, res) => {
  const { errors, isValid } = validateLogin(req.body);
  if (!isValid) return res.status(400).json(errors);

  const email = req.body.email;
  const password = req.body.password;

  appAuth
    .signInWithEmailAndPassword(email, password)
    .then(userRecord => {
      const payload = {
        uid: userRecord.user.uid,
        email: userRecord.user.email
      };
      const token = createCustomToken(payload);
      res.status(200).send({ sucess: true, token: `Bearer ${token}` });
    })
    .catch(error => {
      res.status(400).send({ signInError: "Invalid Credentials.", error });
    });
});

/**
 *  @route        GET /auth/register
 *  @description  Register User
 *  @access       Public
 */
router.post("/register", (req, res) => {
  const { errors, isValid } = validateRegistration(req.body);
  if (!isValid) return res.status(400).json(errors);

  const email = req.body.email;
  const password = req.body.password;
  const name = req.body.name;

  appAuth
    .createUserWithEmailAndPassword(email, password)
    .then(userRecord => {
      return appFirestore
        .collection("users")
        .doc(userRecord.user.uid)
        .set({ email: email, name: name });
    })
    .then(() => {
      res.status(200).send({ success: true });
    })
    .catch(error => {
      console.log("registerError", error);
      res.status(400).send({ createUserError: "error creating users", error });
    });
});

router.get(
  "/authorised-route",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.send("welcome!");
  }
);

module.exports = router;
