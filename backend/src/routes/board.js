import { Router } from "express";
import {
  createComment,
  createPost,
  deleteComment,
  deletePost,
  getPost,
  listPosts,
  updateComment,
  updatePost,
} from "../controllers/boardController.js";
import { authenticate, requireApproved } from "../middleware/auth.js";

export const boardRouter = Router();

boardRouter.use(authenticate, requireApproved);
boardRouter.patch("/comments/:commentId", updateComment);
boardRouter.delete("/comments/:commentId", deleteComment);
boardRouter.get("/", listPosts);
boardRouter.post("/", createPost);
boardRouter.get("/:postId", getPost);
boardRouter.patch("/:postId", updatePost);
boardRouter.delete("/:postId", deletePost);
boardRouter.post("/:postId/comments", createComment);
