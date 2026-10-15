import { Router } from "express"
import { authenticate, requireApproved } from "../middleware/auth.js"
import {
  getOmok,
  postAct,
  postCpuAct,
  postCpuStart,
  postJoin,
  postLeave,
  postStart,
} from "../controllers/omokController.js"

export const omokRouter = Router()

omokRouter.use(authenticate, requireApproved)
omokRouter.get("/", getOmok)
omokRouter.post("/cpu/start", postCpuStart)
omokRouter.post("/cpu/act", postCpuAct)
omokRouter.post("/join", postJoin)
omokRouter.post("/leave", postLeave)
omokRouter.post("/start", postStart)
omokRouter.post("/act", postAct)
