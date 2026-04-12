// const dotenv = require("dotenv").config();
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// desc register new user
// route POST /api/users/register
// access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide name, email and password" });
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(hashedPassword);
  const user = await User.create({
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

// desc login user
// route POST /api/users/login
// access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide email and password" });
  }
  const user = await User.findOne({ email });
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

// desc get current user
// route GET /api/users/current
// access Private
const currentUser = asyncHandler(async (req, res) => {
  res.json(req.user);
});

// ─────────────────────────────────────────────
// desc    Forgot password — send reset email
// route   POST /api/users/forgot-password
// access  Public
// ─────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide your email" });
  }

  const user = await User.findOne({ email });
  if (!user) {
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

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  // Build reset URL  (update CLIENT_URL in .env to your frontend URL)
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${rawToken}`;

  // Send email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MealsOnTheWay" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request",
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset. Click the link below (valid for 1 hour):</p>
      <a href="${resetUrl}" style="background:#e44d26;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Reset Password
      </a>
      <p>If you didn't request this, please ignore this email.</p>
    `,
  });

  res
    .status(200)
    .json({ message: "If that email exists, a reset link has been sent" });
});

// ─────────────────────────────────────────────
// desc    Reset password using token
// route   POST /api/users/reset-password/:token
// access  Public
// ─────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Please provide a new password" });
  }

  // Hash the incoming raw token to compare with stored hash
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }, // not expired
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({ message: "Password has been reset successfully" });
});

module.exports = {
  registerUser,
  loginUser,
  currentUser,
  forgotPassword,
  resetPassword,
};
