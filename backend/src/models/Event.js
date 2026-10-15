import { db } from "../db/database.js";

function mapEvent(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.ID,
    title: row.TITLE,
    description: row.DESCRIPTION || "",
    eventDate: row.EVENT_DATE,
    endDate: row.END_DATE || row.EVENT_DATE,
    startTime: row.START_TIME || "",
    endTime: row.END_TIME || "",
    color: row.COLOR,
    remindMinutes: Number(row.REMIND_MINUTES ?? -1),
    familyId: row.FAMILY_ID || null,
    familyName: row.FAMILY_NAME || "",
    familyColor: row.FAMILY_COLOR || "",
    familyIsClan: Boolean(row.FAMILY_IS_CLAN),
    isFamilyEvent: Boolean(row.IS_FAMILY_EVENT),
    visibility: "ALL",
    createdBy: row.CREATED_BY,
    creatorName: row.CREATOR_NAME || "",
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
  };
}

function sameFamily(event, user) {
  return Boolean(event?.familyId && user?.familyId && Number(event.familyId) === Number(user.familyId));
}

function isClanEvent(event, user) {
  return Boolean(event?.familyId && user?.clanId && Number(event.familyId) === Number(user.clanId));
}

const EVENT_SELECT = `SELECT e.*, u.NAME AS CREATOR_NAME, f.NAME AS FAMILY_NAME, f.COLOR AS FAMILY_COLOR, f.IS_CLAN AS FAMILY_IS_CLAN
         FROM EVENTS e
         INNER JOIN USERS u ON u.ID = e.CREATED_BY
         LEFT JOIN FAMILIES f ON f.ID = e.FAMILY_ID`;

export const Event = {
  create(payload) {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO EVENTS
          (TITLE, DESCRIPTION, EVENT_DATE, END_DATE, START_TIME, END_TIME, COLOR, REMIND_MINUTES, VISIBILITY, CREATED_BY, FAMILY_ID, IS_FAMILY_EVENT, CREATED_AT, UPDATED_AT)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ALL', ?, ?, ?, ?, ?)`
      )
      .run(
        payload.title,
        payload.description || "",
        payload.eventDate,
        payload.endDate || payload.eventDate,
        payload.startTime || "",
        payload.endTime || "",
        payload.color,
        -1,
        Number(payload.createdBy),
        payload.familyId ? Number(payload.familyId) : null,
        payload.isFamilyEvent ? 1 : 0,
        now,
        now
      );

    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    const row = db
      .prepare(
        `${EVENT_SELECT}
         WHERE e.ID = ?`
      )
      .get(Number(id));
    return mapEvent(row);
  },

  findVisible({ from, to }) {
    const rows = db
      .prepare(
        `${EVENT_SELECT}
         WHERE e.EVENT_DATE <= ? AND COALESCE(e.END_DATE, e.EVENT_DATE) >= ?
         ORDER BY e.IS_FAMILY_EVENT DESC, e.EVENT_DATE ASC, e.START_TIME ASC, e.ID ASC`
      )
      .all(to, from);
    return rows.map((row) => mapEvent(row));
  },

  update(id, payload) {
    const current = this.findById(id);
    if (!current) {
      return null;
    }

    db.prepare(
      `UPDATE EVENTS
       SET TITLE = ?, DESCRIPTION = ?, EVENT_DATE = ?, END_DATE = ?, START_TIME = ?, END_TIME = ?,
           COLOR = ?, REMIND_MINUTES = ?, IS_FAMILY_EVENT = ?, VISIBILITY = 'ALL', UPDATED_AT = ?
       WHERE ID = ?`
    ).run(
      payload.title,
      payload.description || "",
      payload.eventDate,
      payload.endDate || payload.eventDate,
      payload.startTime || "",
      payload.endTime || "",
      payload.color,
      -1,
      payload.isFamilyEvent ? 1 : 0,
      new Date().toISOString(),
      Number(id)
    );

    return this.findById(id);
  },

  delete(id) {
    db.prepare("DELETE FROM EVENT_GROUPS WHERE EVENT_ID = ?").run(Number(id));
    db.prepare("DELETE FROM EVENTS WHERE ID = ?").run(Number(id));
  },

  canAccess(event, user) {
    if (!event || !user) {
      return false;
    }
    return true;
  },

  canEdit(event, user) {
    if (!event || !user) {
      return false;
    }
    if (user.isSuperAdmin || event.createdBy === user.id) {
      return true;
    }
    return user.isFamilyAdmin && sameFamily(event, user) && !isClanEvent(event, user);
  },
};
