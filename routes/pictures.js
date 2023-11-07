var express = require("express");
var router = express.Router();
const fs = require("fs");
var path = require("path");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

/* GET pictures listing. */
router.get("/", async function (req, res, next) {
  var params = {
  Bucket: process.env.CYCLIC_BUCKET_NAME,
  Delimiter: '/',
  Prefix: 'public/'
};
var allObjects = await s3.listObjects(params).promise();
  var keys = allObjects?.Contents.map(x => x.Key);
  const pictures = await Promise.all(keys.map(async (key) => {
    let my_file = await s3.getObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: key,
    }).promise();
    return {
      src: Buffer.from(my_file.Body).toString('base64'),
      name: key.split("/").pop()
    }
  }));
  res.render("pictures", { pictures: pictures });
});

router.post("/", async function (req, res, next) {
  const file = req.files.file;
  console.log(req.files);
  await s3
    .putObject({
      Body: file.data,
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: "public/" + file.name,
    })
    .promise();
  res.end();
});


// New GET route for displaying a specific picture by name
router.get("/:pictureName", function (req, res, next) {
  var pictureName = req.params.pictureName;
  var picturePath = path.join(__dirname, "../pictures", pictureName);

  // Check if the file exists in the directory
  fs.access(picturePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Handle file not existing
      console.error(err);
      return res.status(404).send("Picture not found");
    }
    // If the file exists, send it to the client
    res.sendFile(picturePath);
  });
});

module.exports = router;
