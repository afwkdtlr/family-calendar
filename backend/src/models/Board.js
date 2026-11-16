import { db } from "../db/database.js";

function mapPost(row, { includeBody = true } = {}) {
  if (!row) {
    return null;
  }

  const post = {
    id: row.ID,
    authorId: row.AUTHOR_ID,
    authorName: row.AUTHOR_NAME || "",
    title: row.TITLE || "",
    viewCount: Number(row.VIEW_COUNT || 0),
    commentCount: Number(row.COMMENT_COUNT || 0),
    createdAt: row.CREATED_AT,
    updatedAt: row.UPDATED_AT,
  };
  if (includeBody) {
    post.body = row.BODY || "";
  }
  return post;
}

function mapComment(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.ID,
    postId: row.POST_ID,
    authorId: row.AUTHOR_ID,
    authorName: row.AUTHOR_NAME || "",
    body: row.BODY,
    createdAt: row.CREATED_AT,
  };
}

const LIST_SELECT = `
  SELECT p.ID, p.AUTHOR_ID, p.TITLE, p.VIEW_COUNT, p.CREATED_AT, p.UPDATED_AT,
         u.NAME AS AUTHOR_NAME,
         (SELECT COUNT(*) FROM BOARD_COMMENTS c WHERE c.POST_ID = p.ID) AS COMMENT_COUNT
  FROM BOARD_POSTS p
  JOIN USERS u ON u.ID = p.AUTHOR_ID
`;

const POST_SELECT = `
  SELECT p.*, u.NAME AS AUTHOR_NAME
  FROM BOARD_POSTS p
  JOIN USERS u ON u.ID = p.AUTHOR_ID
`;

export const Board = {
  createPost({ authorId, title, body }) {
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `INSERT INTO BOARD_POSTS (BOARD_USER_ID, AUTHOR_ID, TITLE, BODY, VIEW_COUNT, CREATED_AT, UPDATED_AT)
         VALUES (?, ?, ?, ?, 0, ?, ?)`
      )
      .run(Number(authorId), Number(authorId), title, body, now, now);
    return this.findPostById(result.lastInsertRowid);
  },

  findPostById(id) {
    const post = mapPost(db.prepare(`${POST_SELECT} WHERE p.ID = ?`).get(Number(id)));
    if (!post) {
      return null;
    }
    post.comments = this.listComments([post.id]).get(post.id) || [];
    post.commentCount = post.comments.length;
    return post;
  },

  listPosts() {
    return db.prepare(`${LIST_SELECT} ORDER BY p.ID DESC`).all().map((row) => mapPost(row, { includeBody: false }));
  },

  incrementViews(id) {
    db.prepare("UPDATE BOARD_POSTS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE ID = ?").run(Number(id));
  },

  updatePost(id, { title, body }) {
    db.prepare("UPDATE BOARD_POSTS SET TITLE = ?, BODY = ?, UPDATED_AT = ? WHERE ID = ?").run(
      title,
      body,
      new Date().toISOString(),
      Number(id)
    );
    return this.findPostById(id);
  },

  deletePost(id) {
    db.prepare("DELETE FROM BOARD_COMMENTS WHERE POST_ID = ?").run(Number(id));
    db.prepare("DELETE FROM BOARD_POSTS WHERE ID = ?").run(Number(id));
  },

  listComments(postIds) {
    const ids = [...new Set((postIds || []).map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))];
    const grouped = new Map();
    if (!ids.length) {
      return grouped;
    }
    const marks = ids.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT c.*, u.NAME AS AUTHOR_NAME
         FROM BOARD_COMMENTS c
         JOIN USERS u ON u.ID = c.AUTHOR_ID
         WHERE c.POST_ID IN (${marks})
         ORDER BY c.CREATED_AT ASC, c.ID ASC`
      )
      .all(...ids);
    for (const row of rows) {
      const comment = mapComment(row);
      const list = grouped.get(comment.postId) || [];
      list.push(comment);
      grouped.set(comment.postId, list);
    }
    return grouped;
  },

  findCommentById(id) {
    return mapComment(
      db
        .prepare(
          `SELECT c.*, u.NAME AS AUTHOR_NAME
           FROM BOARD_COMMENTS c
           JOIN USERS u ON u.ID = c.AUTHOR_ID
           WHERE c.ID = ?`
        )
        .get(Number(id))
    );
  },

  createComment({ postId, authorId, body }) {
    const createdAt = new Date().toISOString();
    const result = db
      .prepare("INSERT INTO BOARD_COMMENTS (POST_ID, AUTHOR_ID, BODY, CREATED_AT) VALUES (?, ?, ?, ?)")
      .run(Number(postId), Number(authorId), body, createdAt);
    return this.findCommentById(result.lastInsertRowid);
  },

  updateComment(id, body) {
    db.prepare("UPDATE BOARD_COMMENTS SET BODY = ? WHERE ID = ?").run(body, Number(id));
    return this.findCommentById(id);
  },

  deleteComment(id) {
    db.prepare("DELETE FROM BOARD_COMMENTS WHERE ID = ?").run(Number(id));
  },
};
