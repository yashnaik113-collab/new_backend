const asyncHandler = require("express-async-handler");
const Food = require("../models/foodModel");
// desc get all foods
// route GET /api/foods
// access private
const getFoods = asyncHandler(async (req, res) => {
  const foods = await Food.find();
  res.json(foods);
});

// desc create new food
// route POST /api/foods
// access private

const createFood = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    category,
    description,
    isAvailable,
    tags,
    addons,
    kitchenId,
  } = req.body;

  // Required fields
  if (!name || !price || !category) {
    return res.status(400).json({
      message: "name, price and category are required",
    });
  }

  // Images are required — multer puts them in req.files
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      message: "At least one image is required",
    });
  }

  // Convert each uploaded file buffer → base64 string with data URI prefix
  const foodImages = req.files.map(
    (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
  );

  // Normalize addons: accept ["chilli"] or [{name, price}]
  let normalizedAddons = [];
  if (addons) {
    const parsed = typeof addons === "string" ? JSON.parse(addons) : addons;
    if (Array.isArray(parsed)) {
      normalizedAddons = parsed.map((addon) =>
        typeof addon === "string"
          ? { name: addon, price: 0 }
          : { name: addon.name, price: addon.price ?? 0 },
      );
    }
  }

  // tags may come as a JSON string from FormData
  let parsedTags = [];
  if (tags) {
    parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
  }

  const food = await Food.create({
    foodName: name,
    price,
    category,
    description: description || "",
    isAvailable: isAvailable !== undefined ? isAvailable : true,
    tags: parsedTags,
    addons: normalizedAddons,
    foodImages,
    kitchenId: kitchenId || null,
    user_id: req.user.id,
  });

  res.status(201).json({
    message: "Food created successfully",
    food,
  });
});

// desc get food by id
// route GET /api/foods/:id
// access private
const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json("Food not found");
  }
  res.json(food);
});

// desc update food
// route PUT /api/foods/:id
// access private
const updateFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);

  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  if (!food.user_id) {
    return res.status(403).json({ message: "Food has no owner assigned" });
  }

  if (food.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      message: "You do not have permission to update this item",
    });
  }

  const {
    name,
    price,
    category,
    description,
    isAvailable,
    tags,
    addons,
    kitchenId,
  } = req.body;

  const updateData = {};

  if (name !== undefined) updateData.foodName = name;
  if (price !== undefined) updateData.price = price;
  if (category !== undefined) updateData.category = category;
  if (description !== undefined) updateData.description = description;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
  if (kitchenId !== undefined) updateData.kitchenId = kitchenId;

  if (tags !== undefined) {
    updateData.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
  }

  if (addons !== undefined) {
    const parsed = typeof addons === "string" ? JSON.parse(addons) : addons;
    updateData.addons = parsed.map((addon) =>
      typeof addon === "string"
        ? { name: addon, price: 0 }
        : { name: addon.name, price: addon.price ?? 0 },
    );
  }

  // If admin uploads new images, replace existing ones
  if (req.files && req.files.length > 0) {
    updateData.foodImages = req.files.map(
      (file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    );
  }

  const updatedFood = await Food.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    message: "Food updated successfully",
    food: updatedFood,
  });
});

// desc delete food
// route DELETE /api/foods/:id
// access private
const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json("Food not found");
  }

  if (food.user_id.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ message: "User not have permision to update other user things" });
  }
  await food.deleteOne({ user_id: req.params.id });
  res.json({ message: `delete food for ${req.params.id}` });
});

module.exports = {
  getFoods,
  createFood,
  getFoodById,
  updateFood,
  deleteFood,
};
