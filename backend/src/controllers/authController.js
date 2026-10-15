import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User, toPublicUser } from "../models/User.js";

const LOGIN_ID_PATTERN = /^[a-z0-9_]{2,20}$/;

function createToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role, status: user.status },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function readLoginId(body) {
  return String(body?.loginId || body?.email || "").trim().toLowerCase();
}

function readPassword(body) {
  return String(body?.password || "").trim().toLowerCase();
}

export function register(req, res) {
  const loginId = readLoginId(req.body);
  const password = readPassword(req.body);
  const name = String(req.body?.name || "").trim();

  if (!loginId || !password || !name) {
    return res.status(400).json({ message: "이름, 아이디, 비밀번호를 모두 입력해 주세요." });
  }

  if (!LOGIN_ID_PATTERN.test(loginId)) {
    return res.status(400).json({ message: "아이디는 영문, 숫자, _ 만 사용하고 2~20자로 입력해 주세요." });
  }

  if (password.length < 1 || password.length > 6) {
    return res.status(400).json({ message: "비밀번호는 6자 안으로 입력해 주세요." });
  }

  if (User.findByLoginId(loginId)) {
    return res.status(409).json({ message: "이미 사용 중인 아이디입니다." });
  }

  const user = User.create({
    email: loginId,
    password: bcrypt.hashSync(password, 10),
    name,
    role: "MEMBER",
    status: "PENDING",
  });

  return res.status(201).json({
    message: "회원가입이 완료되었습니다. 관리자 승인을 기다려 주세요.",
    user: toPublicUser(user),
  });
}

export function login(req, res) {
  const loginId = readLoginId(req.body);
  const password = readPassword(req.body);

  if (!loginId || !password) {
    return res.status(400).json({ message: "아이디와 비밀번호를 입력해 주세요." });
  }

  const user = User.findByLoginId(loginId);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  if (user.status === "PENDING") {
    return res.status(403).json({
      message: "관리자 승인 대기 중입니다.",
      status: user.status,
      user: toPublicUser(user),
    });
  }

  if (user.status === "REJECTED") {
    return res.status(403).json({
      message: "가입이 거절되었습니다. 관리자에게 문의해 주세요.",
      status: user.status,
      user: toPublicUser(user),
    });
  }

  const token = createToken(user);

  return res.json({
    token,
    user: toPublicUser(user),
  });
}

export function me(req, res) {
  return res.json({ user: req.user });
}
