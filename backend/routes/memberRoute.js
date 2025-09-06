const express = require("express");
const { pool } = require("../db/db");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });

// List members of a project
router.get("/:projectId/members", protect, async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await pool.query(
      `SELECT pm.id, pm.role, u.id as user_id, u.username, u.email
       FROM project_members pm
       JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = $1`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: "Error fetching members", error: err.message });
  }
});

// Add a member (only owner can do this)
router.post("/:projectId/members", protect, async (req, res) => {
  const { projectId } = req.params;
  const { user_id, role } = req.body;

  if (!user_id) return res.status(400).json({ message: "user_id required" });

  try {
    // Check if requester is owner
    const ownerCheck = await pool.query(
      "SELECT 1 FROM projects WHERE id=$1 AND owner_id=$2",
      [projectId, req.user]
    );
    if (ownerCheck.rows.length === 0) return res.status(403).json({ message: "Only owner can add members" });

    const result = await pool.query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1,$2,$3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING *`,
      [projectId, user_id, role || "member"]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Error adding member", error: err.message });
  }
});

// Remove a member (only owner)
router.delete("/:projectId/members/:memberId", protect, async (req, res) => {
  const { projectId, memberId } = req.params;

  try {
    const ownerCheck = await pool.query(
      "SELECT 1 FROM projects WHERE id=$1 AND owner_id=$2",
      [projectId, req.user]
    );
    if (ownerCheck.rows.length === 0) return res.status(403).json({ message: "Only owner can remove members" });

    const result = await pool.query(
      "DELETE FROM project_members WHERE id=$1 AND project_id=$2 RETURNING id",
      [memberId, projectId]
    );

    if (result.rows.length === 0) return res.status(404).json({ message: "Member not found" });
    res.json({ message: "Member removed" });
  } catch (err) {
    res.status(500).json({ message: "Error removing member", error: err.message });
  }
});

module.exports = router;
