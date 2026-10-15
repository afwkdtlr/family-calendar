import jwt from "jsonwebtoken";
import { User, toPublicUser } from "../models/User.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "로그인이 필요합니다." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = User.findById(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    req.user = toPublicUser(user);
    return next();
  } catch {
    return res.status(401).json({ message: "토큰이 만료되었거나 올바르지 않습니다." });
  }
}

export function requireApproved(req, res, next) {
  if (req.user.status !== "APPROVED") {
    return res.status(403).json({
      message: "관리자 승인 후에 이용할 수 있습니다.",
      status: req.user.status,
    });
  }

  return next();
}
