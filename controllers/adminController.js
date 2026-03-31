const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const Food = require("../models/foodModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// ✅ Helper: convert a base64 data-URI string as-is (already in data:mime;base64,... format)
// Mirrors the same approach used in userInfoController — no change to original logic.
const processBase64Image = (base64String) => {
  // Accept raw base64 strings that already carry the data URI prefix
  if (!base64String || typeof base64String !== "string") return null;
  return base64String; // stored exactly as received (data:image/...;base64,...)
};

// desc register new admin
// route POST /api/admin/register
// access Public
const registerAdminUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email and password" });
  }
  const existingUser = await Admin.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  const user = await Admin.create({
    name,
    email,
    password: hashedPassword,
  });

  console.log(user);
  if (user) {
    return res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      email: user.email,
    });
  } else {
    return res.status(400).json({ message: "Invalid user data" });
  }

  // res.json({ message: "register user" });
});

// desc login admin
// route POST /api/admin/login
// access Public
const loginAdminUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }
  const user = await Admin.findOne({ email });
  // compare password with hashed password
  if (user && (await bcrypt.compare(password, user.password))) {
    const accessToken = jwt.sign(
      {
        user: {
          username: user.username,
          email: user.email,
          id: user._id,
        },
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" },
    );
    res.status(200).json({ accessToken });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// desc get current admin
// route GET /api/admin/current
// access Private
const currentAdminUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// ─────────────────────────────────────────────
// desc    Forgot password — send reset email (Admin)
// route   POST /api/admin/forgot-password
// access  Public
// ─────────────────────────────────────────────
const forgotAdminPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide your email" });
  }

  const admin = await Admin.findOne({ email });
  if (!admin) {
    // Return 200 so attackers can't enumerate valid emails
    return res.status(200).json({
      message: "If that email exists, a reset link has been sent",
    });
  }

  // Generate raw token and hash it for storage
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  admin.resetPasswordToken = hashedToken;
  admin.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await admin.save();

  // Build reset URL (update CLIENT_URL in .env to your frontend URL)
  const resetUrl = `${process.env.CLIENT_URL}/admin/reset-password/${rawToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MealsOnTheWay Admin" <${process.env.EMAIL_USER}>`,
    to: admin.email,
    subject: "Admin Password Reset Request",
    html: `
      <h2>Admin Password Reset</h2>
      <p>You requested a password reset for your admin account. Click the link below (valid for 1 hour):</p>
      <a href="${resetUrl}" style="background:#1a1a2e;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Reset Admin Password
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  res
    .status(200)
    .json({ message: "If that email exists, a reset link has been sent" });
});

// ─────────────────────────────────────────────
// desc    Reset password using token (Admin)
// route   POST /api/admin/reset-password/:token
// access  Public
// ─────────────────────────────────────────────
const resetAdminPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Please provide a new password" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const admin = await Admin.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!admin) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  admin.password = await bcrypt.hash(newPassword, 10);
  admin.resetPasswordToken = null;
  admin.resetPasswordExpires = null;
  await admin.save();

  res.status(200).json({ message: "Password has been reset successfully" });
});

// ─────────────────────────────────────────────
// desc    Admin — Add a new food item
// route   POST /api/admin/food
// access  Private (admin token required)
// ─────────────────────────────────────────────
const addFood = asyncHandler(async (req, res) => {
  const {
    foodName,
    price,
    description,
    category,
    isAvailable,
    tags,
    rating,
    kitchenId,
    addons,
    foodImages, // array of base64 strings
  } = req.body;

  // ── Validation ──────────────────────────────
  if (!foodName || !price) {
    return res
      .status(400)
      .json({ message: "Please provide at least foodName and price" });
  }

  if (foodImages && !Array.isArray(foodImages)) {
    return res
      .status(400)
      .json({ message: "foodImages must be an array of base64 strings" });
  }

  // ── Process images (same logic as userInfoController) ───────────────
  const processedImages = [];
  if (foodImages && foodImages.length > 0) {
    for (const base64Str of foodImages) {
      const processed = processBase64Image(base64Str);
      if (processed) {
        processedImages.push(processed);
      }
    }
  }

  // ── Create food document ─────────────────────
  const food = await Food.create({
    foodName,
    price,
    description: description || "",
    category: category || "other",
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    tags: tags || [],
    rating: rating || 4,
    kitchenId: kitchenId || null,
    addons: addons || [],
    foodImages: processedImages, // ✅ array of base64 strings stored in MongoDB
    user_id: req.user.id, // admin's ID (token payload)
  });

  res.status(201).json({
    message: "Food item added successfully",
    food,
  });
});

module.exports = {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
  forgotAdminPassword,
  resetAdminPassword,
  addFood,
};
