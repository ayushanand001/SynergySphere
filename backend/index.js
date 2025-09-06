const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoute");
const { protect } = require("./middleware/auth");
dotenv.config();
const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", userRoutes);

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "This is a protected route", userId: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
