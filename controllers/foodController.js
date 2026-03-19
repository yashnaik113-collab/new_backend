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
  const { name, description, price, category } = req.body;

  if (!name || !description || !price || !category) {
    return res.status(400).json({
      message: "Please provide name, description, price and category",
    });
  }

  const food = await Food.create({
    name,
    description,
    price,
    category,
    user_id: req.user.id,
  });

  res.json(food);
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
    return res.status(404).json("Food not found");
  }

  if (!food.user_id) {
    return res.status(403).json({ message: "Food has no owner assigned" });
  }

  if (food.user_id.toString() !== req.user.id) {
    return res.status(403).json({
      message: "User not have permission to update other user things",
    });
  }

  const updatedFood = await Food.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.json(updatedFood);
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
