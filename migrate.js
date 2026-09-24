"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { getPool } = require("./db");

async function migrate() {
  const pool = getPool();
  if (!pool) throw new Error("DATABASE_URL is not set.");
  const migrationDirectory = path.join(__dirname, "migrations");
  const migrations = fs.readdirSync(migrationDirectory)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
  for (const filename of migrations) {
    await pool.query(fs.readFileSync(path.join(migrationDirectory, filename), "utf8"));
  }
  await pool.end();
  console.log("Database migration completed.");
}

migrate().catch((error) => {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
});
