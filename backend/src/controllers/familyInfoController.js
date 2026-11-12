import { Family } from "../models/Family.js";
import { User } from "../models/User.js";

const MAX_ADDRESS = 200;
const MAX_PLATE = 20;
const MAX_MEMO = 20;
const MAX_VEHICLES = 3;

function canEditFamilyInfo(user, family) {
  if (!user || !family || family.isClan) {
    return false;
  }
  if (user.isSuperAdmin) {
    return true;
  }
  return Number(user.familyId) === Number(family.id);
}

function parseVehicles(raw) {
  if (raw == null) {
    return { value: [] };
  }
  if (!Array.isArray(raw)) {
    return { error: "차량 목록이 올바르지 않습니다." };
  }
  if (raw.length > MAX_VEHICLES) {
    return { error: "차량은 3대까지 적을 수 있습니다." };
  }

  const vehicles = [];
  const seen = new Set();
  for (const item of raw) {
    const plate = String(item?.plate ?? item ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const memo = String(item?.memo || "").trim().slice(0, MAX_MEMO);
    if (!plate) {
      continue;
    }
    if (plate.length > MAX_PLATE) {
      return { error: "차량번호가 너무 깁니다." };
    }
    const key = plate.replace(/\s/g, "").toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    vehicles.push({ plate, memo });
  }

  return { value: vehicles };
}

function toDirectoryItem(family, user) {
  return {
    id: family.id,
    name: family.name,
    color: family.color,
    address: family.address,
    members: User.findByFamily(family.id).map((member) => member.name),
    vehicles: Family.listVehicles(family.id),
    canEdit: canEditFamilyInfo(user, family),
  };
}

export function listFamilyInfo(req, res) {
  const ownId = Number(req.user.familyId) || 0;
  const families = Family.findAll()
    .filter((family) => !family.isClan)
    .map((family) => toDirectoryItem(family, req.user))
    .sort((a, b) => {
      const aMine = Number(a.id) === ownId ? 0 : 1;
      const bMine = Number(b.id) === ownId ? 0 : 1;
      if (aMine !== bMine) {
        return aMine - bMine;
      }
      return a.name.localeCompare(b.name, "ko");
    });

  return res.json({ families });
}

export function updateFamilyInfo(req, res) {
  const current = Family.findById(req.params.id);
  if (!current || current.isClan) {
    return res.status(404).json({ message: "가족을 찾을 수 없습니다." });
  }
  if (!canEditFamilyInfo(req.user, current)) {
    return res.status(403).json({ message: "우리 집 정보만 고칠 수 있습니다." });
  }

  const address = String(req.body?.address || "").trim();
  if (address.length > MAX_ADDRESS) {
    return res.status(400).json({ message: "주소가 너무 깁니다." });
  }

  const parsed = parseVehicles(req.body?.vehicles);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  Family.updateAddress(current.id, address);
  Family.replaceVehicles(current.id, parsed.value);
  return res.json({ family: toDirectoryItem(Family.findById(current.id), req.user) });
}
