const Kitchen = require("../models/kitchenModel");
const asyncHandler = require("express-async-handler");

// desc create kitchen
// route POST /api/kitchens
// access private

const createKitchen = asyncHandler(async (req, res) => {
  const { name, address, phone, isOpen, openingHours, coordinates } = req.body;
  const kitchen = new Kitchen({
    name,
    address: address || "",
    phone: phone || "",
    isOpen: isOpen !== undefined ? isOpen : true,
    openingHours: openingHours || "",
    location: coordinates ? { type: "Point", coordinates } : undefined,
  });
  await kitchen.save();
  res
    .status(201)
    .json({ success: true, message: "Kitchen created", data: kitchen });
});

// desc get all kitchens
// route GET /api/kitchens
// access private

const getKitchens = asyncHandler(async (req, res) => {
  const kitchens = await Kitchen.find().sort({ createdAt: -1 });
  res.json({ success: true, data: kitchens });
});

// desc get kitchen by id
// route GET /api/kitchens/:id
// access private

const getKitchenById = asyncHandler(async (req, res) => {
  const kitchen = await Kitchen.findById(req.params.id);
  if (!kitchen) {
    return res
      .status(404)
      .json({ success: false, message: "Kitchen not found" });
  }
  res.json({ success: true, data: kitchen });
});

// desc update kitchen
// route PUT /api/kitchens/:id
// access private

const updateKitchen = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (updates.coordinates) {
    updates.location = { type: "Point", coordinates: updates.coordinates };
    delete updates.coordinates;
  }
  const kitchen = await Kitchen.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!kitchen) {
    return res
      .status(404)
      .json({ success: false, message: "Kitchen not found" });
  }
  res.json({ success: true, message: "Kitchen updated", data: kitchen });
});

// desc delete kitchen
// route DELETE /api/kitchens/:id
// access private

const deleteKitchen = asyncHandler(async (req, res) => {
  const kitchen = await Kitchen.findByIdAndDelete(req.params.id);
  if (!kitchen) {
    return res
      .status(404)
      .json({ success: false, message: "Kitchen not found" });
  }
  res.json({ success: true, message: "Kitchen deleted" });
});

module.exports = {
  createKitchen,
  getKitchens,
  getKitchenById,
  updateKitchen,
  deleteKitchen,
};
