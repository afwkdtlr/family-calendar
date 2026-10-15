import { db } from "../db/database.js";

export const GameScore = {
  create({ userId, familyId, score }) {
    db.prepare(
      "INSERT INTO GAME_SCORES (USER_ID, FAMILY_ID, SCORE, CREATED_AT) VALUES (?, ?, ?, ?)"
    ).run(Number(userId), familyId ? Number(familyId) : null, Number(score), new Date().toISOString());
  },

  leaderboard({ familyId, isSuperAdmin }) {
    if (!isSuperAdmin && !familyId) {
      return [];
    }

    const where = isSuperAdmin ? "" : "WHERE g.FAMILY_ID = ?";
    const params = isSuperAdmin ? [] : [Number(familyId)];
    return db
      .prepare(
        `SELECT u.ID AS USER_ID, u.NAME, MAX(g.SCORE) AS SCORE
         FROM GAME_SCORES g
         INNER JOIN USERS u ON u.ID = g.USER_ID
         ${where}
         GROUP BY u.ID, u.NAME
         ORDER BY SCORE DESC, u.NAME ASC
         LIMIT 20`
      )
      .all(...params)
      .map((row) => ({
        userId: row.USER_ID,
        name: row.NAME,
        score: row.SCORE,
      }));
  },
};
