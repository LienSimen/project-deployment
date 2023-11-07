var express = require("express");
var router = express.Router();
const fs = require("fs");
var path = require("path");

// Or
/* GET pictures listing. */
router.get("/", function (req, res, next) {
  const pictures = fs.readdirSync(path.join(__dirname, "../pictures/"));
  res.render("pictures", { pictures: pictures });
});

router.post("/", function (req, res, next) {
  const file = req.files.file;
  fs.writeFileSync(path.join(__dirname, "../pictures/", file.name), file.data);
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
