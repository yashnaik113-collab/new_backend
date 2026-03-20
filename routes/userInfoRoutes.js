const express = require("express");
const multer = require("multer");

const validateTokenHandler = require("../middlewares/validateTokenHandler");
const {
  getUserInfo,
  createUserInfo,
  updateUserInfo,
  updatePassword,
} = require("../controllers/userInfoController");

const router = express.Router();

// ✅ memory storage — no files saved to disk
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 2MB limit
});

router.get("/", validateTokenHandler, getUserInfo);
router.post(
  "/",
  validateTokenHandler,
  upload.single("profileImage"),
  createUserInfo,
);
router.put("/update-password", validateTokenHandler, updatePassword);
router.put(
  "/:id",
  validateTokenHandler,
  upload.single("profileImage"),
  updateUserInfo,
);

module.exports = router;
