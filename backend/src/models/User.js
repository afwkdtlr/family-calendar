import { db } from "../db/database.js";
import { Family } from "./Family.js";

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.ID,
    email: row.EMAIL,
    password: row.PASSWORD,
    name: row.NAME,
    role: row.ROLE,
    status: row.STATUS,
    familyId: row.FAMILY_ID || null,
    isFamilyAdmin: Boolean(row.IS_FAMILY_ADMIN),
    createdAt: row.CREATED_AT,
  };
}

export function toPublicUser(user) {
  if (!user) {
    return null;
  }

  const family = user.familyId ? Family.findById(user.familyId) : null;
  const clan = Family.clan();
  const smallFamily = family?.isClan ? null : family;
  const isSuperAdmin = user.role === "ADMIN";

  return {
    id: user.id,
    loginId: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    clanId: clan?.id || null,
    clanName: clan?.name || "우리가족",
    clanColor: clan?.color || "#d9a394",
    clanBackgroundUrl: clan?.backgroundUrl || "",
    familyId: smallFamily?.id || null,
    familyName: smallFamily?.name || "",
    familyColor: smallFamily?.color || "",
    familyBackgroundUrl: smallFamily?.backgroundUrl || "",
    isSuperAdmin,
    isFamilyAdmin: !isSuperAdmin && user.isFamilyAdmin,
    isManager: isSuperAdmin || user.isFamilyAdmin,
    createdAt: user.createdAt,
  };
}

export const User = {
  create({ email, password, name, role = "MEMBER", status = "PENDING", familyId = null, isFamilyAdmin = false }) {
    const createdAt = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO USERS (EMAIL, PASSWORD, NAME, ROLE, STATUS, FAMILY_ID, IS_FAMILY_ADMIN, CREATED_AT)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(email, password, name, role, status, familyId, isFamilyAdmin ? 1 : 0, createdAt);

    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const row = db.prepare("SELECT * FROM USERS WHERE ID = ?").get(Number(id));
    return mapUser(row);
  },

  findByEmail(email) {
    return this.findByLoginId(email);
  },

  findByLoginId(loginId) {
    const row = db
      .prepare("SELECT * FROM USERS WHERE EMAIL = ?")
      .get(String(loginId || "").trim().toLowerCase());
    return mapUser(row);
  },

  updateLoginId(id, loginId) {
    db.prepare("UPDATE USERS SET EMAIL = ? WHERE ID = ?").run(
      String(loginId).trim().toLowerCase(),
      Number(id)
    );
    return this.findById(id);
  },

  updatePassword(id, passwordHash) {
    db.prepare("UPDATE USERS SET PASSWORD = ? WHERE ID = ?").run(passwordHash, Number(id));
    return this.findById(id);
  },

  findPending() {
    return db
      .prepare("SELECT * FROM USERS WHERE STATUS = 'PENDING' ORDER BY CREATED_AT DESC")
      .all()
      .map(mapUser);
  },

  findApproved() {
    return db
      .prepare("SELECT * FROM USERS WHERE STATUS = 'APPROVED' ORDER BY ROLE DESC, NAME ASC")
      .all()
      .map(mapUser);
  },

  findByFamily(familyId) {
    return db
      .prepare(
        "SELECT * FROM USERS WHERE STATUS = 'APPROVED' AND FAMILY_ID = ? ORDER BY IS_FAMILY_ADMIN DESC, NAME ASC"
      )
      .all(Number(familyId))
      .map(mapUser);
  },

  countByRole(role) {
    const row = db.prepare("SELECT COUNT(*) AS CNT FROM USERS WHERE ROLE = ?").get(role);
    return row?.CNT ?? 0;
  },

  updateStatus(id, status) {
    db.prepare("UPDATE USERS SET STATUS = ? WHERE ID = ?").run(status, Number(id));
    return this.findById(id);
  },

  assignFamily(id, familyId, isFamilyAdmin = false) {
    db.prepare("UPDATE USERS SET FAMILY_ID = ?, IS_FAMILY_ADMIN = ? WHERE ID = ?").run(
      familyId ? Number(familyId) : null,
      isFamilyAdmin ? 1 : 0,
      Number(id)
    );
    return this.findById(id);
  },

  setFamilyAdmin(id, isFamilyAdmin) {
    db.prepare("UPDATE USERS SET IS_FAMILY_ADMIN = ? WHERE ID = ?").run(
      isFamilyAdmin ? 1 : 0,
      Number(id)
    );
    return this.findById(id);
  },
};
