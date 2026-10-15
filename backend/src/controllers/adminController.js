import { removeCoversForFamily, saveCoverFromDataUrl } from "../lib/familyCover.js";
import { Family } from "../models/Family.js";
import { User, toPublicUser } from "../models/User.js";

const ALLOWED_STATUS = ["APPROVED", "REJECTED"];
const FAMILY_COLORS = ["#d9a394", "#e0b25a", "#8fb8a0", "#8aa4c8", "#b89aa8"];

function parseFamilyId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function getPendingUsers(req, res) {
  const users = User.findPending().map(toPublicUser);
  return res.json({ users });
}

export function getApprovedUsers(req, res) {
  if (req.user.isSuperAdmin) {
    return res.json({ users: User.findApproved().map(toPublicUser) });
  }

  const users = User.findByFamily(req.user.familyId).map(toPublicUser);
  return res.json({ users });
}

export function listFamilies(req, res) {
  if (req.user.isSuperAdmin) {
    const families = Family.findAll().map((family) => ({
      ...family,
      memberCount: family.isClan ? null : Family.countMembers(family.id),
    }));
    return res.json({ families });
  }

  const mine = Family.findById(req.user.familyId);
  return res.json({
    families: mine && !mine.isClan
      ? [{ ...mine, memberCount: Family.countMembers(mine.id) }]
      : [],
  });
}

export function createFamily(req, res) {
  const name = String(req.body?.name || "").trim();
  const color = String(req.body?.color || FAMILY_COLORS[0]).trim();

  if (!name) {
    return res.status(400).json({ message: "가족 이름을 입력해 주세요." });
  }
  if (!FAMILY_COLORS.includes(color)) {
    return res.status(400).json({ message: "선택할 수 없는 색상입니다." });
  }
  if (Family.findByName(name)) {
    return res.status(409).json({ message: "이미 있는 가족 이름입니다." });
  }

  const family = Family.create({ name, color });
  return res.status(201).json({ family });
}

export function updateFamily(req, res) {
  const current = Family.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "가족을 찾을 수 없습니다." });
  }

  const name = String(req.body?.name || "").trim();
  const color = String(req.body?.color || current.color).trim();
  if (!name) {
    return res.status(400).json({ message: "가족 이름을 입력해 주세요." });
  }
  const duplicated = Family.findByName(name);
  if (duplicated && duplicated.id !== current.id) {
    return res.status(409).json({ message: "이미 있는 가족 이름입니다." });
  }
  if (current.isClan && name !== "우리가족") {
    return res.status(400).json({ message: "우리가족 이름은 바꿀 수 없습니다." });
  }
  if (!FAMILY_COLORS.includes(color)) {
    return res.status(400).json({ message: "선택할 수 없는 색상입니다." });
  }

  return res.json({ family: Family.update(current.id, { name, color }) });
}

export function uploadFamilyBackground(req, res) {
  const current = Family.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "가족을 찾을 수 없습니다." });
  }
  if (!req.user.isSuperAdmin && Number(req.user.familyId) !== Number(current.id)) {
    return res.status(403).json({ message: "우리 가족 사진만 바꿀 수 있습니다." });
  }

  try {
    const filename = saveCoverFromDataUrl(current.id, req.body?.image);
    const family = Family.updateBackground(current.id, filename);
    return res.json({
      family,
      message: "가족 배경 사진을 바꿨습니다.",
    });
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message });
  }
}

export function deleteFamily(req, res) {
  const current = Family.findById(req.params.id);
  if (!current) {
    return res.status(404).json({ message: "가족을 찾을 수 없습니다." });
  }
  if (current.isClan) {
    return res.status(400).json({ message: "우리가족은 삭제할 수 없습니다." });
  }

  removeCoversForFamily(current.id);
  Family.delete(current.id);
  return res.json({ message: "가족을 삭제했습니다." });
}

export function updateUserStatus(req, res) {
  const status = String(req.body?.status || "").toUpperCase();
  const userId = Number(req.params.id);

  if (!ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({ message: "status는 APPROVED 또는 REJECTED만 가능합니다." });
  }

  const target = User.findById(userId);
  if (!target) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }
  if (target.role === "ADMIN") {
    return res.status(400).json({ message: "최종 관리자 계정은 변경할 수 없습니다." });
  }

  if (status === "REJECTED") {
    const updated = User.updateStatus(userId, "REJECTED");
    return res.json({ message: "가입을 거절했습니다.", user: toPublicUser(updated) });
  }

  let familyId = parseFamilyId(req.body?.familyId);
  if (req.user.isFamilyAdmin) {
    familyId = req.user.familyId;
  }
  const family = Family.findById(familyId);
  if (!family || family.isClan) {
    return res.status(400).json({ message: "소가족을 선택해 주세요." });
  }

  User.updateStatus(userId, "APPROVED");
  const updated = User.assignFamily(userId, familyId, false);
  return res.json({
    message: "가입을 승인했습니다.",
    user: toPublicUser(updated),
  });
}

export function updateUserFamily(req, res) {
  const target = User.findById(req.params.id);
  if (!target) {
    return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
  }
  if (target.role === "ADMIN") {
    return res.status(400).json({ message: "최종 관리자는 가족에 넣지 않습니다." });
  }

  const familyId = parseFamilyId(req.body?.familyId);
  const family = Family.findById(familyId);
  if (!family || family.isClan) {
    return res.status(400).json({ message: "소가족을 선택해 주세요." });
  }

  const isFamilyAdmin = Boolean(req.body?.isFamilyAdmin);
  const updated = User.assignFamily(target.id, familyId, isFamilyAdmin);
  return res.json({
    message: isFamilyAdmin ? "가족 관리 권한을 부여했습니다." : "소속 가족을 변경했습니다.",
    user: toPublicUser(updated),
  });
}
