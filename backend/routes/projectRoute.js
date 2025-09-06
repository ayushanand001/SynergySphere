const express = require("express");
const { pool } = require("../db/db");
const { protect } = require("../middleware/auth");

const router = express.Router();

// 🔹 Create a project
router.post("/", protect, async (req, res) => {
  const { name, description, tags, deadline, priority, image } = req.body;
  if (!name) return res.status(400).json({ message: "Project name is required" });

  try {
    const result = await pool.query(
      `INSERT INTO projects (owner_id, name, description, tags, deadline, priority, image)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user, name, description || null, tags || null, deadline || null, priority || "medium", image || null]
    );

    // also insert owner as manager in project_members
    await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1,$2,'manager') ON CONFLICT DO NOTHING`,
      [result.rows[0].id, req.user]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
});

// 🔹 Get all projects
router.get("/", protect, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT p.*
      FROM projects p
      LEFT JOIN project_members pm ON pm.project_id = p.id
      WHERE p.owner_id = $1 OR pm.user_id = $1
      ORDER BY p.created_at DESC
      `,
      [req.user]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
});

// 🔹 Get single project
router.get("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM projects WHERE id=$1", [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
});

// 🔹 Update project (only owner)
router.put("/:id", protect, async (req, res) => {
  const { name, description, tags, deadline, priority, image } = req.body;
  try {
    const result = await pool.query(
      `UPDATE projects
       SET name=COALESCE($1, name),
           description=COALESCE($2, description),
           tags=COALESCE($3, tags),
           deadline=COALESCE($4, deadline),
           priority=COALESCE($5, priority),
           image=COALESCE($6, image)
       WHERE id=$7 AND owner_id=$8
       RETURNING *`,
      [name || null, description || null, tags || null, deadline || null, priority || null, image || null, req.params.id, req.user]
    );

    if (result.rows.length === 0) return res.status(403).json({ message: "Not allowed" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
});

// 🔹 Delete project
router.delete("/:id", protect, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM projects WHERE id=$1 AND owner_id=$2 RETURNING id", [req.params.id, req.user]);
    if (result.rows.length === 0) return res.status(403).json({ message: "Not allowed" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
});

module.exports = router;
