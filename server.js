"use strict";

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { saveApplication } = require("./db");

const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_URL = process.env.APPLICATION_WEBHOOK_URL;
const MAX_BODY_BYTES = 12_000;
const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 5;
const programs = new Set(["Начальный уровень", "Основная программа", "Изучение Корана", "Арабский язык"]);
const requests = new Map();
const publicFiles = new Map([
  ["/", "index.html"], ["/index.html", "index.html"], ["/styles.css", "styles.css"], ["/app.js", "app.js"], ["/swagger-init.js", "swagger-init.js"],
  ["/api/openapi.yaml", "openapi.yaml"], ["/openapi.yaml", "openapi.yaml"], ["/api/swagger.json", "swagger.json"], ["/swagger.json", "swagger.json"], ["/swagger", "swagger.html"],
  ["/swagger/", "swagger.html"]
]);

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}

function clientIp(req) {
  return req.socket.remoteAddress || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const active = (requests.get(ip) || []).filter((time) => now - time < WINDOW_MS);
  active.push(now);
  requests.set(ip, active);
  return active.length > MAX_REQUESTS;
}

function text(value, maxLength) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, maxLength) : "";
}

function validate(payload) {
  const data = {
    studentName: text(payload.studentName, 120),
    birthDate: text(payload.birthDate, 10),
    guardianName: text(payload.guardianName, 120),
    phone: text(payload.phone, 30),
    program: text(payload.program, 80),
    comment: text(payload.comment, 1_000),
    consent: payload.consent === "on" || payload.consent === true
  };
  if (text(payload.website, 100)) return { error: "Запрос отклонён." };
  if (!data.studentName || !data.guardianName || !data.phone || !data.birthDate || !data.consent) return { error: "Заполните все обязательные поля." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.birthDate) || Number.isNaN(Date.parse(`${data.birthDate}T00:00:00Z`))) return { error: "Укажите корректную дату рождения." };
  if (data.phone.replace(/\D/g, "").length < 7) return { error: "Укажите корректный номер телефона." };
  if (!programs.has(data.program)) return { error: "Выберите программу из списка." };
  return { data };
}

async function deliverApplication(data) {
  const applicationId = await saveApplication(data);
  if (!WEBHOOK_URL) return applicationId;
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Al-Bushra-Application-API/1.0" },
    body: JSON.stringify({ type: "application.created", submittedAt: new Date().toISOString(), application: data }),
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`Delivery failed with status ${response.status}`);
  return applicationId;
}

function serveFile(req, res) {
  const filename = publicFiles.get(new URL(req.url, "http://localhost").pathname);
  if (!filename) return send(res, 404, { message: "Не найдено." });
  const filePath = path.join(__dirname, filename);
  const type = filename.endsWith(".css") ? "text/css" : filename.endsWith(".js") ? "text/javascript" : filename.endsWith(".yaml") ? "application/yaml" : filename.endsWith(".json") ? "application/json" : "text/html";
  res.writeHead(200, { "Content-Type": `${type}; charset=utf-8`, "X-Content-Type-Options": "nosniff" });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com; font-src https://fonts.gstatic.com; script-src 'self' https://unpkg.com; img-src 'self' data:; connect-src 'self' http://localhost:3000; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "3600");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    return res.end();
  }
  
  if (req.method === "GET") {
    if (req.url === "/health") {
      return send(res, 200, { status: "ok", timestamp: new Date().toISOString() });
    }
    if (req.url === "/api/applications") {
      return send(res, 200, { total: 0, lastUpdate: new Date().toISOString() });
    }
    return serveFile(req, res);
  }
  
  if (req.method !== "POST" || req.url !== "/api/applications") return send(res, 404, { message: "Не найдено." });
  if (isRateLimited(clientIp(req))) return send(res, 429, { message: "Слишком много попыток. Повторите позже." });
  let body = "";
  req.on("data", (chunk) => { body += chunk; if (Buffer.byteLength(body) > MAX_BODY_BYTES) req.destroy(); });
  req.on("end", async () => {
    try {
      const check = validate(JSON.parse(body));
      if (check.error) return send(res, 400, { message: check.error });
      await deliverApplication(check.data);
      return send(res, 201, { message: "Заявка принята." });
    } catch {
      return send(res, 503, { message: "Сервис приёма заявок временно недоступен. Попробуйте позже." });
    }
  });
});

server.listen(PORT, () => console.log(`Al Bushra server listening on http://localhost:${PORT}`));
