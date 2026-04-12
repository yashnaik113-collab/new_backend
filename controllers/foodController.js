const asyncHandler = require("express-async-handler");
const Food = require("../models/foodModel");

// Helper: replaces raw base64 foodImages with URL array
const formatFoodResponse = (food, req) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const foodObj = food.toObject();

  foodObj.images = (food.foodImages || []).map(
    (_, i) => `${baseUrl}/api/foods/${food._id}/images/${i}`,
  );

  delete foodObj.foodImages; // remove raw base64 from response
  return foodObj;
};

// desc   Get all foods
// route  GET /api/foods
// access private
const getFoods = asyncHandler(async (req, res) => {
  // ❌ Don't use select("-foodImages") — you need it to build URLs
  const foods = await Food.find();

  const baseUrl = `${req.protocol}://${req.get("host")}`;

  const response = foods.map((food) => {
    const foodObj = food.toObject();

    // Build image URLs from actual foodImages array length
    foodObj.images = (food.foodImages || []).map(
      (_, i) => `${baseUrl}/api/foods/${food._id}/images/${i}`,
    );

    delete foodObj.foodImages; // strip raw base64 before sending
    return foodObj;
  });

  res.json(response);
});
// desc   Get food by ID
// route  GET /api/foods/:id
// access private
const getFoodById = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  res.json(formatFoodResponse(food, req));
});

// desc   Serve a single image by index
// route  GET /api/foods/:id/images/:index
// access public
const getFoodImage = asyncHandler(async (req, res) => {
  const { id, index } = req.params;

  const food = await Food.findById(id).select("foodImages");
  if (!food) {
    return res.status(404).json({ message: "Food not found" });
  }

  const imgIndex = parseInt(index);
  if (isNaN(imgIndex) || imgIndex < 0 || imgIndex >= food.foodImages.length) {
    return res.status(404).json({ message: "Image not found" });
  }

  const base64String = food.foodImages[imgIndex];
  const matches = base64String.match(/^data:(.+);base64,(.+)$/);

  if (!matches) {
    return res.status(400).json({ message: "Invalid image data" });
  }

  const contentType = matches[1];
  const imageBuffer = Buffer.from(matches[2], "base64");

  res.set("Content-Type", contentType);
  res.set("Cache-Control", "public, max-age=86400"); // cache 1 day
  res.send(imageBuffer);
});

// desc   Create new food
// route  POST /api/foods
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

  if (!name || !price || !category) {
    return res
      .status(400)
      .json({ message: "name, price and category are required" });
  }

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "At least one image is required" });
  }

  const foodImages = req.files.map(
    (file) => `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
  );

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
    imageCount: foodImages.length, // ← track count for efficient GET all
    kitchenId: kitchenId || null,
    user_id: req.user.id,
  });

  res.status(201).json({
    message: "Food created successfully",
    food: formatFoodResponse(food, req),
  });
});

// desc   Update food
// route  PUT /api/foods/:id
// access private
const updateFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);

  if (!food) return res.status(404).json({ message: "Food not found" });
  if (!food.user_id)
    return res.status(403).json({ message: "Food has no owner assigned" });
  if (food.user_id.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You do not have permission to update this item" });
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

  if (req.files && req.files.length > 0) {
    updateData.foodImages = req.files.map(
      (file) =>
        `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    );
    updateData.imageCount = updateData.foodImages.length; // ← keep in sync
  }

  const updatedFood = await Food.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  });

  res.json({
    message: "Food updated successfully",
    food: formatFoodResponse(updatedFood, req),
  });
});

// desc   Delete food
// route  DELETE /api/foods/:id
// access private
const deleteFood = asyncHandler(async (req, res) => {
  const food = await Food.findById(req.params.id);

  if (!food) return res.status(404).json({ message: "Food not found" });

  if (food.user_id.toString() !== req.user.id) {
    return res
      .status(403)
      .json({ message: "You do not have permission to delete this item" });
  }

  await food.deleteOne();
  res.json({ message: `Food ${req.params.id} deleted successfully` });
});

module.exports = {
  getFoods,
  createFood,
  getFoodById,
  getFoodImage,
  updateFood,
  deleteFood,
};
