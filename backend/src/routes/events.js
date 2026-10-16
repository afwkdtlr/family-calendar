import { Router } from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  listEvents,
  listPeople,
  updateEvent,
} from "../controllers/eventController.js";
import { authenticate, requireApproved } from "../middleware/auth.js";

export const eventRouter = Router();

eventRouter.use(authenticate, requireApproved);
eventRouter.get("/", listEvents);
eventRouter.get("/people", listPeople);
eventRouter.post("/", createEvent);
eventRouter.get("/:id", getEvent);
eventRouter.patch("/:id", updateEvent);
eventRouter.delete("/:id", deleteEvent);
