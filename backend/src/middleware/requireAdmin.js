export function requireAdmin(req, res, next) {
  if (!req.user?.isManager) {
    return res.status(403).json({ message: "관리 권한이 없습니다." });
  }

  if (req.user.status !== "APPROVED") {
    return res.status(403).json({ message: "승인된 관리자만 접근할 수 있습니다." });
  }

  return next();
}

export function requireSuperAdmin(req, res, next) {
  if (!req.user?.isSuperAdmin || req.user.status !== "APPROVED") {
    return res.status(403).json({ message: "최종 관리자만 할 수 있습니다." });
  }

  return next();
}
