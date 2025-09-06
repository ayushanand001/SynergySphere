const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "authdb",
  password: process.env.DB_PASS || "postgres",
  port: parseInt(process.env.DB_PORT || "5432"),
});

pool.connect()
  .then(() => console.log("Connected to PostgreSQL"))
  .catch(err => console.error("DB connection error", err));

module.exports = { pool };
