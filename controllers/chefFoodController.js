const chefFood = require("../models/chefFoodModel");
const asyncHandler = require("express-async-handler");

// desc get all chef foods
// route GET /api/cheffoods
// access private
const getChefFoods = asyncHandler(async (req, res) => {
  const chefFoods = await chefFood.find();
  res.json(chefFoods);
});

// desc create new chef food
// route POST /api/cheffoods
// access private
const createChefFood = asyncHandler(async (req, res) => {
  console.log(req.body);
  const {
    chef_id,
    hotelname,
    foodname,
    actualPrice,
    discountedPrice,
    category,
    specialDish,
    isAvailable,
    tags,
    rating,
  } = req.body;
  if (
    !chef_id ||
    !hotelname ||
    !foodname ||
    !actualPrice ||
    !discountedPrice ||
    !category
  ) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }
  const cheffood = await chefFood.create({
    chef_id,
    hotelname,
    foodname,
    actualPrice,
    discountedPrice,
    category,
    specialDish,
    isAvailable,
    tags,
    rating,
  });

  res.json(cheffood);
});

// desc get chef food by id
// route GET /api/cheffoods/:id
// access private
const getChefFoodById = asyncHandler(async (req, res) => {
  const cheffood = await chefFood.findById(req.params.id);
  if (!cheffood) {
    return res.status(404).json("Chef Food not found");
  }
  res.json(cheffood);
});

// desc update chef food
// route PUT /api/cheffoods/:id
// access private
const updateChefFood = asyncHandler(async (req, res) => {
  const cheffood = await chefFood.findById(req.params.id);
  if (!cheffood) {
    return res.status(404).json("Chef Food not found");
  }
  const updatedChefFood = await chefFood.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
    }
  );
  res.json(updatedChefFood);
});

module.exports = {
  getChefFoods,
  createChefFood,
  getChefFoodById,
  updateChefFood,
};
