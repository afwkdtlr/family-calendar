import { Router } from "express";
import { getVapidKey, removeSubscription, saveSubscription } from "../controllers/pushController.js";
import { authenticate, requireApproved } from "../middleware/auth.js";

export const pushRouter = Router();

pushRouter.use(authenticate, requireApproved);
pushRouter.get("/vapid", getVapidKey);
pushRouter.post("/subscribe", saveSubscription);
pushRouter.post("/unsubscribe", removeSubscription);
