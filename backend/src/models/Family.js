import { coverUrl } from "../lib/familyCover.js";
import { db } from "../db/database.js";

function mapFamily(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.ID,
    name: row.NAME,
    color: row.COLOR,
    background: row.BACKGROUND || "",
    backgroundUrl: coverUrl(row.BACKGROUND),
    isClan: Boolean(row.IS_CLAN),
    createdAt: row.CREATED_AT,
  };
}

export const Family = {
  create({ name, color }) {
    const createdAt = new Date().toISOString();
    const result = db
      .prepare("INSERT INTO FAMILIES (NAME, COLOR, CREATED_AT) VALUES (?, ?, ?)")
      .run(name, color, createdAt);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    if (!id) {
      return null;
    }
    return mapFamily(db.prepare("SELECT * FROM FAMILIES WHERE ID = ?").get(Number(id)));
  },

  findByName(name) {
    return mapFamily(db.prepare("SELECT * FROM FAMILIES WHERE NAME = ?").get(name));
  },

  findAll() {
    return db.prepare("SELECT * FROM FAMILIES ORDER BY IS_CLAN DESC, NAME ASC").all().map(mapFamily);
  },

  clan() {
    return mapFamily(db.prepare("SELECT * FROM FAMILIES WHERE IS_CLAN = 1 ORDER BY ID ASC").get());
  },

  ensureClan() {
    const current = this.clan();
    if (current) {
      if (current.name !== "우리가족" && !this.findByName("우리가족")) {
        db.prepare("UPDATE FAMILIES SET NAME = '우리가족' WHERE ID = ?").run(current.id);
      }
      return this.attachOrphanEvents(this.clan());
    }

    const named = this.findByName("우리가족") || this.findByName("우리 가족");
    if (named) {
      db.prepare("UPDATE FAMILIES SET IS_CLAN = 1, NAME = '우리가족' WHERE ID = ?").run(named.id);
      return this.attachOrphanEvents(this.findById(named.id));
    }

    const createdAt = new Date().toISOString();
    const result = db
      .prepare("INSERT INTO FAMILIES (NAME, COLOR, CREATED_AT, IS_CLAN) VALUES ('우리가족', '#d9a394', ?, 1)")
      .run(createdAt);
    return this.attachOrphanEvents(this.findById(result.lastInsertRowid));
  },

  attachOrphanEvents(clan) {
    if (clan?.id) {
      db.prepare("UPDATE EVENTS SET FAMILY_ID = ? WHERE FAMILY_ID IS NULL").run(clan.id);
    }
    return clan;
  },

  update(id, { name, color }) {
    db.prepare("UPDATE FAMILIES SET NAME = ?, COLOR = ? WHERE ID = ?").run(name, color, Number(id));
    return this.findById(id);
  },

  updateBackground(id, filename) {
    db.prepare("UPDATE FAMILIES SET BACKGROUND = ? WHERE ID = ?").run(filename || null, Number(id));
    return this.findById(id);
  },

  delete(id) {
    const current = this.findById(id);
    if (current?.isClan) {
      return false;
    }
    db.prepare("UPDATE USERS SET FAMILY_ID = NULL, IS_FAMILY_ADMIN = 0 WHERE FAMILY_ID = ?").run(Number(id));
    db.prepare("UPDATE EVENTS SET FAMILY_ID = NULL WHERE FAMILY_ID = ?").run(Number(id));
    db.prepare("DELETE FROM FAMILIES WHERE ID = ?").run(Number(id));
  },

  countMembers(id) {
    const row = db.prepare("SELECT COUNT(*) AS CNT FROM USERS WHERE FAMILY_ID = ?").get(Number(id));
    return row?.CNT ?? 0;
  },
};
