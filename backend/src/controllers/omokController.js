import { actCpu, actPvp, joinPvp, leavePvp, startCpu, startPvp, viewOmok } from "../game/omokRooms.js"

function send(res, fn) {
  try {
    return res.json(fn())
  } catch (error) {
    return res.status(error.status || 400).json({ message: error.message || "오목을 진행할 수 없습니다." })
  }
}

export function getOmok(req, res) {
  const mode = req.query.mode === "pvp" ? "pvp" : "cpu"
  return send(res, () => viewOmok(req.user, mode))
}

export function postCpuStart(req, res) {
  return send(res, () => startCpu(req.user))
}

export function postCpuAct(req, res) {
  return send(res, () => actCpu(req.user, req.body))
}

export function postJoin(req, res) {
  return send(res, () => joinPvp(req.user, req.body))
}

export function postLeave(req, res) {
  return send(res, () => leavePvp(req.user))
}

export function postStart(req, res) {
  return send(res, () => startPvp(req.user))
}

export function postAct(req, res) {
  return send(res, () => actPvp(req.user, req.body))
}
