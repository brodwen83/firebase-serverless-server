const functions = require("firebase-functions");

const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;

const firebase = require("firebase/app");
require("firebase/firestore");
var db = firebase.firestore();
const firebaseHelper = require("firebase-functions-helper");

const options = {};
options.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
options.secretOrKey = functions.config().ryoaki.jwtsecret;

module.exports = passport => {
  passport.use(
    new JwtStrategy(options, (jwt_payload, done) => {
      console.log("jwt-payload", jwt_payload);
      firebaseHelper.firestore
        .getDocument(db, "users", jwt_payload.uid)
        .then(user => {
          if (user) {
            return done(null, user);
          }
          return done(null, false);
        })
        .catch(error => {
          console.log("passport-error", error);
        });
    })
  );
};
