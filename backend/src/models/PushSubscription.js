import { db } from "../db/database.js";

function mapSubscription(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.USER_ID,
    endpoint: row.ENDPOINT,
    p256dh: row.P256DH,
    auth: row.AUTH,
    createdAt: row.CREATED_AT,
  };
}

export const PushSubscription = {
  save(userId, { endpoint, p256dh, auth }) {
    const createdAt = new Date().toISOString();
    db.prepare(
      `INSERT INTO PUSH_SUBSCRIPTIONS (USER_ID, ENDPOINT, P256DH, AUTH, CREATED_AT)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(ENDPOINT) DO UPDATE SET
         USER_ID = excluded.USER_ID,
         P256DH = excluded.P256DH,
         AUTH = excluded.AUTH`
    ).run(Number(userId), endpoint, p256dh, auth, createdAt);
    return this.findByEndpoint(endpoint);
  },

  findByEndpoint(endpoint) {
    const row = db.prepare("SELECT * FROM PUSH_SUBSCRIPTIONS WHERE ENDPOINT = ?").get(endpoint);
    return mapSubscription(row);
  },

  findByUserIds(userIds) {
    const ids = [...new Set((userIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
    if (!ids.length) {
      return [];
    }

    const marks = ids.map(() => "?").join(",");
    return db
      .prepare(`SELECT * FROM PUSH_SUBSCRIPTIONS WHERE USER_ID IN (${marks})`)
      .all(...ids)
      .map(mapSubscription);
  },

  removeByEndpoint(endpoint) {
    db.prepare("DELETE FROM PUSH_SUBSCRIPTIONS WHERE ENDPOINT = ?").run(endpoint);
  },

  removeByUser(userId, endpoint) {
    if (endpoint) {
      db.prepare("DELETE FROM PUSH_SUBSCRIPTIONS WHERE USER_ID = ? AND ENDPOINT = ?").run(Number(userId), endpoint);
      return;
    }
    db.prepare("DELETE FROM PUSH_SUBSCRIPTIONS WHERE USER_ID = ?").run(Number(userId));
  },
};
