"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { getPool } = require("./db");

async function migrate() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set.");
  const sql = fs.readFileSync(path.join(__dirname, "migrations", "001_create_applications.sql"), "utf8");
  await pool.query(sql);
  await pool.end();
  console.log("Database migration completed.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
