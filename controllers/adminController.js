const asyncHandler = require("express-async-handler");
const Admin = require("../models/adminModel");
const Food = require("../models/foodModel");
const Order = require("../models/orderModel");
const ServiceArea = require("../models/serviceAreaModel");
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

// ─────────────────────────────────────────────
// desc    Get all orders (admin dashboard view)
// route   GET /api/admin/orders
// access  Private (admin token required)
// ─────────────────────────────────────────────
const getAllOrdersAdmin = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("userId", "name email phone") // populate basic user info
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders,
  });
});

// ─────────────────────────────────────────────
// desc    Get dashboard statistics
// route   GET /api/admin/dashboard
// access  Private (admin token required)
// ─────────────────────────────────────────────
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalOrders,
    successfulPayments,
    pendingOrders,
    revenueData
  ] = await Promise.all([
    Order.countDocuments(),
    Order.countDocuments({ paymentStatus: "success" }),
    Order.countDocuments({ orderStatus: "placed" }), // Or any other state you consider "pending"
    Order.aggregate([
      { $match: { paymentStatus: "success" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" }
        }
      }
    ])
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  res.status(200).json({
    success: true,
    data: {
      totalOrders,
      successfulPayments,
      pendingOrders,
      totalRevenue
    }
  });
});

// ─────────────────────────────────────────────
// desc    Admin — Update food availability status
// route   PATCH /api/admin/food/:id/availability
// access  Private (admin token required)
// ─────────────────────────────────────────────
const updateFoodAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isAvailable } = req.body;

  if (typeof isAvailable !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid boolean value for isAvailable",
    });
  }

  const food = await Food.findById(id);

  if (!food) {
    return res.status(404).json({
      success: false,
      message: "Food item not found",
    });
  }

  food.isAvailable = isAvailable;
  await food.save();

  res.status(200).json({
    success: true,
    message: "Food availability updated successfully",
    data: food,
  });
});

// ─────────────────────────────────────────────
// Pincode Management Logic (ServiceArea Schema)
// ─────────────────────────────────────────────

// route   POST /api/admin/pincode/add
const addPincode = asyncHandler(async (req, res) => {
  const { pincode, areaName } = req.body;

  if (!pincode || !areaName) {
    return res.status(400).json({ message: "Please provide pincode and areaName" });
  }

  const existing = await ServiceArea.findOne({ pincode });
  if (existing) {
    return res.status(400).json({ message: "Pincode already exists" });
  }

  const serviceArea = await ServiceArea.create({
    pincode,
    areaName,
  });

  res.status(201).json({
    success: true,
    message: "Pincode added successfully",
    data: serviceArea,
  });
});

// route   GET /api/admin/pincode/list
const listPincodes = asyncHandler(async (req, res) => {
  const pincodes = await ServiceArea.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    count: pincodes.length,
    data: pincodes,
  });
});

// route   PATCH /api/admin/pincode/:id/status
const updatePincodeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be a boolean" });
  }

  const serviceArea = await ServiceArea.findByIdAndUpdate(
    id,
    { isActive },
    { new: true }
  );

  if (!serviceArea) {
    return res.status(404).json({ message: "Pincode not found" });
  }

  res.status(200).json({
    success: true,
    message: "Pincode status updated",
    data: serviceArea,
  });
});

// route   DELETE /api/admin/pincode/:id
const deletePincode = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const serviceArea = await ServiceArea.findByIdAndDelete(id);

  if (!serviceArea) {
    return res.status(404).json({ message: "Pincode not found" });
  }

  res.status(200).json({
    success: true,
    message: "Pincode removed successfully",
  });
});

module.exports = {
  registerAdminUser,
  loginAdminUser,
  currentAdminUser,
  forgotAdminPassword,
  resetAdminPassword,
  addFood,
  getAllOrdersAdmin,
  getAdminDashboardStats,
  updateFoodAvailability,
  addPincode,
  listPincodes,
  updatePincodeStatus,
  deletePincode,
};
