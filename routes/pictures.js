var express = require("express");
var router = express.Router();
const fs = require("fs");
var path = require("path");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const { requiresAuth } = require("express-openid-connect");

/* GET pictures listing. */
router.get("/", requiresAuth(), async function (req, res, next) {
  var params = {
    Bucket: process.env.CYCLIC_BUCKET_NAME,
    Delimiter: "/",
    Prefix: "public/",
  };
  var allObjects = await s3.listObjects(params).promise();
  var keys = allObjects?.Contents.map((x) => x.Key);
  const pictures = await Promise.all(
    keys.map(async (key) => {
      let my_file = await s3
        .getObject({
          Bucket: process.env.CYCLIC_BUCKET_NAME,
          Key: key,
        })
        .promise();
      return {
        src: Buffer.from(my_file.Body).toString("base64"),
        name: key.split("/").pop(),
      };
    })
  );
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
router.get("/:pictureName", requiresAuth(), async function (req, res, next) {
  const pictureName = req.params.pictureName;

  try {
    // Fetch the object from S3
    const data = await s3
      .getObject({
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: `public/${pictureName}`,
      })
      .promise();

    // Determine content type for setting the correct Content-Type header
    const contentType =
      path.extname(pictureName) === ".png" ? "image/png" : "image/jpeg";

    // Set the appropriate content type for the response
    res.setHeader("Content-Type", contentType);

    // Send the image data
    res.send(data.Body);
  } catch (err) {
    console.error(err);
    res.status(404).send("Picture not found");
  }
});

module.exports = router;
