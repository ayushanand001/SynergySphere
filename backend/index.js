dotenv.config();
const express = require("express");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoute");
const projectRoutes = require("./routes/projectRoute");
const memberRoutes = require("./routes/memberRoute");
const taskRoutes = require("./routes/taskRoute");
const { protect } = require("./middleware/auth");
const app = express();

app.use(express.json());

// Routes
app.use("/api/projects", projectRoutes);
app.use("/api/auth", userRoutes);
app.use("/api/projects", memberRoutes);
app.use("/api/projects", taskRoutes);


app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "This is a protected route", userId: req.user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
