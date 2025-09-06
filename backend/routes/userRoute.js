const express = require("express");
const bcrypt = require("bcryptjs");
const { pool } = require("../db/db");
const { z } = require("zod");
const { generateToken } = require("../utils/generateToken");

const router = express.Router();

const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Sign up
router.post("/signup", async (req, res) => {
  try {
    const { username, email, password } = signupSchema.parse(req.body);

    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newUser = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hashedPassword]
    );

    const token = generateToken(newUser.rows[0].id);

    res.json({ user: newUser.rows[0], token });
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (user.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user.rows[0].id);

    res.json({
      user: {
        id: user.rows[0].id,
        username: user.rows[0].username,
        email: user.rows[0].email,
      },
      token,
    });
  } catch (err) {
    res.status(400).json({ error: err.errors || err.message });
  }
});

module.exports = router;
