const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const UserInfo = require("../models/userInfoModel");
const User = require("../models/userModel"); // your auth user model

// ─────────────────────────────────────────────
// desc    Get logged-in user info
// route   GET /api/userinfo
// access  Private
// ─────────────────────────────────────────────
const getUserInfo = asyncHandler(async (req, res) => {
  const userInfo = await UserInfo.findOne({ user_id: req.user.id });
  console.log("Decoded user:", req.user);

  if (!userInfo) {
    return res.status(404).json({ message: "User info not found" });
  }

  res.json(userInfo);
});

// ─────────────────────────────────────────────
// desc    Create user info (first-time setup)
// route   POST /api/userinfo
// access  Private
// ─────────────────────────────────────────────
// ✅ helper to convert buffer to base64
const toBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
};

const createUserInfo = asyncHandler(async (req, res) => {
  const { name, phone, email, address, pincode, city, state } = req.body;

  if (!name || !phone || !email) {
    return res
      .status(400)
      .json({ message: "Please provide name, phone and email" });
  }

  const alreadyExists = await UserInfo.findOne({ user_id: req.user.id });
  if (alreadyExists) {
    return res
      .status(400)
      .json({ message: "User info already exists, use update instead" });
  }

  const userInfo = await UserInfo.create({
    user_id: req.user.id,
    name,
    phone,
    email,
    address,
    pincode,
    city,
    state,
    profileImage: req.file ? toBase64(req.file) : "", // ✅ base64 string saved in mongo
  });

  res.status(201).json(userInfo);
});

const updateUserInfo = asyncHandler(async (req, res) => {
  const userInfo = await UserInfo.findById(req.params.id);

  if (!userInfo) {
    return res.status(404).json({ message: "User info not found" });
  }

  if (userInfo.user_id.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ message: "Not authorized to update this profile" });
  }

  const { name, phone, email, address, pincode, city, state } = req.body;

  const updatedInfo = await UserInfo.findByIdAndUpdate(
    req.params.id,
    {
      name: name || userInfo.name,
      phone: phone || userInfo.phone,
      email: email || userInfo.email,
      address: address || userInfo.address,
      pincode: pincode || userInfo.pincode,
      city: city || userInfo.city,
      state: state || userInfo.state,
      profileImage: req.file ? toBase64(req.file) : userInfo.profileImage, // ✅
    },
    { new: true },
  );

  res.json(updatedInfo);
});

// ─────────────────────────────────────────────
// desc    Update password
// route   PUT /api/userinfo/update-password
// access  Private
// ─────────────────────────────────────────────
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Please provide current and new password" });
  }

  const user = await User.findById(req.user.id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  res.json({ message: "Password updated successfully" });
});

module.exports = {
  getUserInfo,
  createUserInfo,
  updateUserInfo,
  updatePassword,
};
