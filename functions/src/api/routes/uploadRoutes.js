const functions = require("firebase-functions");
const express = require("express");
const passport = require("passport");
const bodyParser = require("body-parser");

const { Storage } = require("@google-cloud/storage");
const os = require("os");
const path = require("path");
const Busboy = require("busboy");
const fs = require("fs");

const storage = new Storage({
  projectId: functions.config().ryoaki.projectid,
  keyFilename: "./src/config/path/to/serviceAccount.json"
});

const router = express.Router();

router.post(
  "/:destination",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const busboy = new Busboy({
      headers: req.headers
    });
    let uploadData = null;
    const destinationFolder = req.params.destination;
    let theFileName = "";

    busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const filepath = path.join(os.tmpdir(), filename);
      uploadData = { file: filepath, type: mimetype, name: filename };
      theFileName = filename;
      file.pipe(fs.createWriteStream(filepath));
    });

    busboy.on("finish", () => {
      const bucket = storage.bucket(functions.config().ryoaki.storagebucket);
      bucket
        .upload(uploadData.file, {
          uploadType: "media",
          metadata: {
            metadata: {
              contentType: uploadData.type
            }
          },
          destination: `/${destinationFolder}/${uploadData.name}`
        })
        .then(() => {
          res.status(200).json({
            message: `uploading ${theFileName} successfully!`
          });
        })
        .catch(err => {
          res.status(500).send({
            message: "error during upload",
            err
          });
        });
    });
    busboy.end(req.rawBody);
  }
);

module.exports = router;
