import { Router } from "express";
import { listFamilyInfo, updateFamilyInfo } from "../controllers/familyInfoController.js";
import { authenticate, requireApproved } from "../middleware/auth.js";

export const familyInfoRouter = Router();

familyInfoRouter.use(authenticate, requireApproved);
familyInfoRouter.get("/", listFamilyInfo);
familyInfoRouter.patch("/:id", updateFamilyInfo);
