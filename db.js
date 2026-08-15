"use strict";

const { Pool } = require("pg");
const fs = require("node:fs");
const path = require("node:path");

function loadLocalEnvironment() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    if (!line || line.trimStart().startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnvironment();
const connectionString = process.env.DATABASE_URL;
const useSsl = process.env.DATABASE_SSL === "true";
let pool;

function getPool() {
  if (!connectionString) return null;
  if (!pool) {
    pool = new Pool({
      connectionString,
      ssl: useSsl ? { rejectUnauthorized: true } : undefined,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000
    });
  }
  return pool;
}

async function saveApplication(application) {
  const database = getPool();
  if (!database) throw new Error("Database is not configured");
  const result = await database.query(
    `INSERT INTO applications
      (student_name, birth_date, guardian_name, phone, program, comment, consent_given_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     RETURNING id`,
    [
      application.studentName,
      application.birthDate,
      application.guardianName,
      application.phone,
      application.program,
      application.comment || null
    ]
  );
  return result.rows[0].id;
}

module.exports = { getPool, saveApplication };
