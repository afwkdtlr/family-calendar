import { Board } from "../models/Board.js";
import { User } from "../models/User.js";

const MAX_TITLE = 80;
const MAX_POST = 2000;
const MAX_COMMENT = 400;

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function canModerate(user, authorId) {
  if (!user) {
    return false;
  }
  if (user.isSuperAdmin || Number(user.id) === Number(authorId)) {
    return true;
  }
  if (!user.isFamilyAdmin || !user.familyId) {
    return false;
  }
  const author = User.findById(authorId);
  return Boolean(author && Number(author.familyId) === Number(user.familyId));
}

function withFlags(user, post) {
  return {
    ...post,
    canEdit: canModerate(user, post.authorId),
    comments: (post.comments || []).map((comment) => ({
      ...comment,
      canEdit: canModerate(user, comment.authorId),
    })),
  };
}

function parseText(raw, max, label) {
  const value = String(raw || "").trim();
  if (!value) {
    return { error: `${label}을 입력해 주세요.` };
  }
  if (value.length > max) {
    return { error: `${label}이 너무 깁니다.` };
  }
  return { value };
}

function parsePostFields(body) {
  const title = parseText(body?.title, MAX_TITLE, "제목");
  if (title.error) {
    return title;
  }
  const content = parseText(body?.body, MAX_POST, "내용");
  if (content.error) {
    return content;
  }
  return { title: title.value, body: content.value };
}

export function listPosts(req, res) {
  const posts = Board.listPosts().map((post) => ({
    ...post,
    canEdit: canModerate(req.user, post.authorId),
  }));
  return res.json({ posts });
}

export function getPost(req, res) {
  const id = parseId(req.params.postId);
  if (!id) {
    return res.status(404).json({ message: "글을 찾을 수 없습니다." });
  }
  if (req.query.view !== "0") {
    Board.incrementViews(id);
  }
  const post = Board.findPostById(id);
  if (!post) {
    return res.status(404).json({ message: "글을 찾을 수 없습니다." });
  }
  return res.json({ post: withFlags(req.user, post) });
}

export function createPost(req, res) {
  const parsed = parsePostFields(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const post = Board.createPost({
    authorId: req.user.id,
    title: parsed.title,
    body: parsed.body,
  });
  return res.status(201).json({ post: withFlags(req.user, post) });
}

export function updatePost(req, res) {
  const current = Board.findPostById(req.params.postId);
  if (!current) {
    return res.status(404).json({ message: "글을 찾을 수 없습니다." });
  }
  if (!canModerate(req.user, current.authorId)) {
    return res.status(403).json({ message: "이 글을 고칠 수 없습니다." });
  }

  const parsed = parsePostFields(req.body);
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  return res.json({ post: withFlags(req.user, Board.updatePost(current.id, parsed)) });
}

export function deletePost(req, res) {
  const current = Board.findPostById(req.params.postId);
  if (!current) {
    return res.status(404).json({ message: "글을 찾을 수 없습니다." });
  }
  if (!canModerate(req.user, current.authorId)) {
    return res.status(403).json({ message: "이 글을 지울 수 없습니다." });
  }
  Board.deletePost(current.id);
  return res.json({ ok: true });
}

export function createComment(req, res) {
  const post = Board.findPostById(req.params.postId);
  if (!post) {
    return res.status(404).json({ message: "글을 찾을 수 없습니다." });
  }

  const parsed = parseText(req.body?.body, MAX_COMMENT, "댓글");
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const comment = Board.createComment({
    postId: post.id,
    authorId: req.user.id,
    body: parsed.value,
  });
  return res.status(201).json({
    comment: {
      ...comment,
      canEdit: canModerate(req.user, comment.authorId),
    },
  });
}

export function updateComment(req, res) {
  const current = Board.findCommentById(req.params.commentId);
  if (!current) {
    return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
  }
  if (!canModerate(req.user, current.authorId)) {
    return res.status(403).json({ message: "이 댓글을 고칠 수 없습니다." });
  }

  const parsed = parseText(req.body?.body, MAX_COMMENT, "댓글");
  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const comment = Board.updateComment(current.id, parsed.value);
  return res.json({
    comment: {
      ...comment,
      canEdit: canModerate(req.user, comment.authorId),
    },
  });
}

export function deleteComment(req, res) {
  const current = Board.findCommentById(req.params.commentId);
  if (!current) {
    return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
  }
  if (!canModerate(req.user, current.authorId)) {
    return res.status(403).json({ message: "이 댓글을 지울 수 없습니다." });
  }
  Board.deleteComment(current.id);
  return res.json({ ok: true });
}
