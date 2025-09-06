const express = require("express");
const { pool } = require("../db/db");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Create a project
router.post("/", protect, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Project name is required" });

  try {
    const result = await pool.query(
      "INSERT INTO projects (owner_id, name, description) VALUES ($1, $2, $3) RETURNING *",
      [req.user, name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
});

// Get all projects for logged-in user (owner or member)
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

// Get a single project by id
router.get("/:id", protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const result = await pool.query("SELECT * FROM projects WHERE id=$1", [projectId]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Project not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
});

// Update a project (only owner can do this)
router.put("/:id", protect, async (req, res) => {
  const { name, description } = req.body;
  try {
    const projectId = req.params.id;
    const result = await pool.query(
      "UPDATE projects SET name=COALESCE($1, name), description=COALESCE($2, description) WHERE id=$3 AND owner_id=$4 RETURNING *",
      [name || null, description || null, projectId, req.user]
    );

    if (result.rows.length === 0) return res.status(403).json({ message: "Not allowed" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
});

// Delete a project (only owner)
router.delete("/:id", protect, async (req, res) => {
  try {
    const projectId = req.params.id;
    const result = await pool.query("DELETE FROM projects WHERE id=$1 AND owner_id=$2 RETURNING id", [projectId, req.user]);
    if (result.rows.length === 0) return res.status(403).json({ message: "Not allowed" });
    res.json({ message: "Project deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
});

module.exports = router;
