const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "authdb",
  password: process.env.DB_PASS || "postgres",
  port: parseInt(process.env.DB_PORT || "5432", 10),
});

(async () => {
  const client = await pool.connect();
  try {
    console.log("Connected to PostgreSQL");

    // Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        tags TEXT[],
        deadline DATE,
        priority VARCHAR(10) CHECK (priority IN ('low','medium','high')) DEFAULT 'medium',
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Project Members
    await client.query(`
      CREATE TABLE IF NOT EXISTS project_members (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(30) DEFAULT 'member',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_id, user_id)
      );
    `);

    // Tasks
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title VARCHAR(150) NOT NULL,
        description TEXT,
        status VARCHAR(20) CHECK (status IN ('pending','in-progress','done')) DEFAULT 'pending',
        due_date DATE,
        tags TEXT[],
        image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects(owner_id);`);

    console.log("Tables are ready ✅");
  } catch (e) {
    console.error("DB init error:", e);
  } finally {
    client.release();
  }
})();

module.exports = { pool };
