const express = require("express");
const dotenv = require("dotenv").config();
const connectDB = require("./config/db");
const authmiddleware = require("./middlewares/authMiddleware");
const imageRoutes = require("./routes/imageroutes");
// const orderRoutes = require("./routes/orderRoutes");
// app.use(cors());
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
connectDB();

app.use("/api/foods", require("./routes/foodRoutes"));
app.use("/api/carts", require("./routes/cartRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
// app.use(authmiddleware);
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/kitchens", require("./routes/kitchenRoutes"));
app.use("/api/chefs", require("./routes/chefAuthRoutes"));
app.use("/api/userinfo", require("./routes/userInfoRoutes"));
app.use("/api/images", imageRoutes);

app.get("/", (req, res) =>
  res.json({ success: true, message: "API is running" }),
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
