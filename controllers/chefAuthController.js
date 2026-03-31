const chef = require("../models/chefModel");
const asynchandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Register Chef
const registerChef = asynchandler(async (req, res) => {
  const { name, specialty, experienceYears, contactEmail, phoneNumber, bio, password } =
    req.body;

  // Validation
  if (!name || !specialty || !experienceYears || !contactEmail || !password) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields (including password)" });
  }

  // Check if chef already exists
  const chefExists = await chef.findOne({ contactEmail });
  if (chefExists) {
    return res.status(400).json({ message: "Chef already exists" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create chef
  const newChef = await chef.create({
    name,
    specialty,
    experienceYears,
    contactEmail,
    phoneNumber,
    bio,
    password: hashedPassword,
  });

  if (newChef) {
    res.status(201).json({
      _id: newChef.id,
      name: newChef.name,
      specialty: newChef.specialty,
      experienceYears: newChef.experienceYears,
      contactEmail: newChef.contactEmail,
      phoneNumber: newChef.phoneNumber,
      bio: newChef.bio,
      token: generateToken(newChef._id),
    });
  } else {
    res.status(400).json({ message: "Invalid chef data" });
  }
});

// Login Chef
const loginChef = asynchandler(async (req, res) => {
  const { contactEmail, password } = req.body;

  // Check for chef email
  const chefExists = await chef.findOne({ contactEmail });
  if (chefExists && (await bcrypt.compare(password, chefExists.password))) {
    res.json({
      _id: chefExists.id,
      name: chefExists.name,
      specialty: chefExists.specialty,
      experienceYears: chefExists.experienceYears,
      contactEmail: chefExists.contactEmail,
      phoneNumber: chefExists.phoneNumber,
      bio: chefExists.bio,
      token: generateToken(chefExists._id),
    });
  } else {
    res.status(401).json({ message: "Invalid email or password" });
  }
});

// ─────────────────────────────────────────────
// Forgot Password — Chef
// ─────────────────────────────────────────────
const forgotChefPassword = asynchandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Please provide your email" });
  }

  const existingChef = await chef.findOne({ contactEmail: email });
  if (!existingChef) {
    return res.status(200).json({ message: "If that email exists, a reset link has been sent" });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  existingChef.resetPasswordToken = hashedToken;
  existingChef.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await existingChef.save();

  const resetUrl = `${process.env.CLIENT_URL}/chef/reset-password/${rawToken}`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"MealsOnTheWay" <${process.env.EMAIL_USER}>`,
    to: existingChef.contactEmail,
    subject: "Chef Password Reset Request",
    html: `
      <h2>Chef Password Reset</h2>
      <p>Click the link below to reset your password (valid for 1 hour):</p>
      <a href="${resetUrl}" style="background:#4CAF50;color:#fff;padding:10px 20px;border-radius:5px;text-decoration:none;">
        Reset Chef Password
      </a>
    `,
  });

  res.status(200).json({ message: "If that email exists, a reset link has been sent" });
});

// ─────────────────────────────────────────────
// Reset Password — Chef
// ─────────────────────────────────────────────
const resetChefPassword = asynchandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({ message: "Please provide a new password" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const existingChef = await chef.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!existingChef) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  existingChef.password = await bcrypt.hash(newPassword, 10);
  existingChef.resetPasswordToken = null;
  existingChef.resetPasswordExpires = null;
  await existingChef.save();

  res.status(200).json({ message: "Password reset successfully" });
});

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  registerChef,
  loginChef,
  forgotChefPassword,
  resetChefPassword,
};
