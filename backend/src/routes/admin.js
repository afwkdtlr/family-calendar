import { Router } from "express";
import {
  createFamily,
  deleteFamily,
  getApprovedUsers,
  getPendingUsers,
  listFamilies,
  updateFamily,
  updateUserFamily,
  updateUserStatus,
  uploadFamilyBackground,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin, requireSuperAdmin } from "../middleware/requireAdmin.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);
adminRouter.get("/pending-users", getPendingUsers);
adminRouter.get("/approved-users", getApprovedUsers);
adminRouter.get("/families", listFamilies);
adminRouter.patch("/users/:id/status", updateUserStatus);
adminRouter.post("/families", requireSuperAdmin, createFamily);
adminRouter.patch("/families/:id", requireSuperAdmin, updateFamily);
adminRouter.post("/families/:id/background", uploadFamilyBackground);
adminRouter.delete("/families/:id", requireSuperAdmin, deleteFamily);
adminRouter.patch("/users/:id/family", requireSuperAdmin, updateUserFamily);
