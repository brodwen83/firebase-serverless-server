const express = require("express");
const gcs = require("@google-cloud/storage");
const cors = require("cors")({ origin: true });

const router = express.Router();

router.post("/advertisements", (req, res) => {
  cors(req, res, () => {
    res.status(200).json({ message: "It's working!" });
  });
});

module.exports = router;
