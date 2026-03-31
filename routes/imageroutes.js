const express = require("express");
const router = express.Router();

const upload = require("../middlewares/upload");
const { uploadImage, getImage } = require("../controllers/imagecontroller");

router.post("/upload", upload.single("image"), uploadImage);

router.get("/image/:id", getImage);

module.exports = router;
