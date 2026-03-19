const chef = require("../models/chefModel");
const asynchandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register Chef
const registerChef = asynchandler(async (req, res) => {
  const { name, specialty, experienceYears, contactEmail, phoneNumber, bio } =
    req.body;

  // Validation
  if (!name || !specialty || !experienceYears || !contactEmail) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  // Check if chef already exists
  const chefExists = await chef.findOne({ contactEmail });
  if (chefExists) {
    return res.status(400).json({ message: "Chef already exists" });
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

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

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

module.exports = {
  registerChef,
  loginChef,
};
