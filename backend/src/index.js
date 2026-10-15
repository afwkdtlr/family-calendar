import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import { initDatabase } from "./db/database.js";
import { User } from "./models/User.js";
import { authRouter } from "./routes/auth.js";
import { adminRouter } from "./routes/admin.js";
import { eventRouter } from "./routes/events.js";
import { omokRouter } from "./routes/omok.js";
import { Family } from "./models/Family.js";
import { coversDir, ensureCoversDir, sweepOrphanCovers } from "./lib/familyCover.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

initDatabase();
Family.ensureClan();
migrateLegacyAccounts();
seedAdmin();
ensureCoversDir();
sweepOrphanCovers(Family.findAll().map((family) => family.background));

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(
  cors({
    origin: true,
  })
);
app.use(express.json({ limit: "8mb" }));
app.use("/api/covers", express.static(coversDir));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/admin", adminRouter);
app.use("/api/events", eventRouter);
app.use("/api/omok", omokRouter);

app.use("/api", (req, res) => {
  res.status(404).json({ message: "요청한 주소를 찾을 수 없습니다." });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: "서버 오류가 발생했습니다." });
});

if (process.env.NODE_ENV === "production") {
  serveFrontend(app, frontendDist);
}

const host = process.env.HOST || "0.0.0.0";
app.listen(port, host, () => {
  console.log(`Family calendar API listening on http://${host}:${port}`);
});

function serveFrontend(app, distDir) {
  const indexFile = path.join(distDir, "index.html");
  if (!fs.existsSync(indexFile)) {
    console.warn("프론트 빌드가 없습니다. frontend에서 npm run build 를 먼저 실행하세요.");
    return;
  }

  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }
    if (req.path.startsWith("/api") || path.extname(req.path)) {
      return next();
    }
    res.sendFile(indexFile);
  });
}

function adminLoginId() {
  return (process.env.ADMIN_LOGIN_ID || "admin").trim().toLowerCase();
}

function adminPassword() {
  return (process.env.ADMIN_PASSWORD || "123456").trim().toLowerCase();
}

function migrateLegacyAccounts() {
  const aliases = [
    ["admin@family.local", "admin"],
    ["mom@family.local", "mom"],
    ["dad@family.local", "dad"],
  ];

  for (const [oldId, newId] of aliases) {
    const current = User.findByLoginId(oldId);
    if (current && !User.findByLoginId(newId)) {
      User.updateLoginId(current.id, newId);
    }
  }

  const loginId = adminLoginId();
  const admins = User.findApproved().filter((user) => user.role === "ADMIN");
  const admin = User.findByLoginId(loginId) || admins[0];
  if (!admin) {
    return;
  }

  if (admin.email !== loginId && !User.findByLoginId(loginId)) {
    User.updateLoginId(admin.id, loginId);
  }

  User.updatePassword(admin.id, bcrypt.hashSync(adminPassword(), 10));
  console.log(`관리자 계정을 맞췄습니다: ${loginId}`);
}

function seedAdmin() {
  if (User.countByRole("ADMIN") > 0) {
    return;
  }

  const loginId = adminLoginId();
  const password = adminPassword();
  const name = process.env.ADMIN_NAME || "관리자";

  User.create({
    email: loginId,
    password: bcrypt.hashSync(password, 10),
    name,
    role: "ADMIN",
    status: "APPROVED",
  });

  console.log(`초기 관리자 계정이 생성되었습니다: ${loginId}`);
}
