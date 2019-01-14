const express = require("express");

const router = express.Router();

router.post("/advertisements", (req, res) => {
  res.status(200).json({ message: "It's working!" });
});

module.exports = router;
