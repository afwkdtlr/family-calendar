import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  updateEvent,
} from "../controllers/eventController.js";
import { authenticate, requireApproved } from "../middleware/auth.js";

export const eventRouter = Router();

eventRouter.use(authenticate, requireApproved);
eventRouter.get("/", listEvents);
eventRouter.post("/", createEvent);
eventRouter.get("/:id", getEvent);
eventRouter.patch("/:id", updateEvent);
eventRouter.delete("/:id", deleteEvent);
