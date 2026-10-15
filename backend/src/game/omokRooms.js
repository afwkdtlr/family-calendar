import { createGame, place, playCpu, present } from "./omokEngine.js"

const cpuRooms = new Map()
const familyRooms = new Map()

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  throw error
}

function emptyPvp(user) {
  return {
    familyId: user.familyId,
    familyName: user.familyName || "우리 가족",
    status: "lobby",
    players: [],
    state: null,
    updatedAt: Date.now(),
  }
}

function pvpRoom(user) {
  if (!user.familyId) return null
  const key = `family-${user.familyId}`
  if (!familyRooms.has(key)) familyRooms.set(key, emptyPvp(user))
  return familyRooms.get(key)
}

function touch(room) {
  room.updatedAt = Date.now()
  return room
}

function pvpView(room, user) {
  const me = room.players.find((item) => item.id === user.id) || null
  return {
    mode: "pvp",
    status: room.status,
    familyName: room.familyName,
    players: room.players.map((item) => ({ id: item.id, name: item.name })),
    me,
    host: room.players[0]?.id === user.id,
    game: room.state ? present(room.state, user.id) : null,
  }
}

export function viewOmok(user, mode) {
  if (mode === "cpu") {
    const room = cpuRooms.get(user.id)
    if (!room) return { mode: "cpu", status: "idle", game: null }
    return { mode: "cpu", status: "playing", game: present(room.state, user.id) }
  }
  const room = pvpRoom(user)
  if (!room) return { mode: "pvp", status: "nofamily", players: [], game: null }
  return pvpView(room, user)
}

export function startCpu(user) {
  const state = createGame(
    { id: user.id, name: user.name },
    { id: "cpu", name: "컴퓨터", cpu: true }
  )
  cpuRooms.set(user.id, { state })
  return { mode: "cpu", status: "playing", game: present(state, user.id) }
}

export function actCpu(user, body) {
  const room = cpuRooms.get(user.id)
  if (!room) fail("진행 중인 판이 없습니다.")
  place(room.state, user.id, body?.x, body?.y)
  playCpu(room.state)
  return { mode: "cpu", status: "playing", game: present(room.state, user.id) }
}

export function joinPvp(user) {
  const room = pvpRoom(user)
  if (!room) fail("가족이 배정되어야 같이 둘 수 있습니다.")
  if (room.players.some((item) => item.id === user.id)) return pvpView(touch(room), user)
  if (room.status === "playing") fail("지금 판이 진행 중입니다.", 409)
  if (room.players.length >= 2) fail("두 명만 들어갈 수 있습니다.", 409)
  room.players.push({ id: user.id, name: user.name })
  return pvpView(touch(room), user)
}

export function leavePvp(user) {
  const room = pvpRoom(user)
  if (!room) return viewOmok(user, "pvp")
  room.players = room.players.filter((item) => item.id !== user.id)
  room.status = "lobby"
  room.state = null
  return pvpView(touch(room), user)
}

export function startPvp(user) {
  const room = pvpRoom(user)
  if (!room) fail("가족이 배정되어야 같이 둘 수 있습니다.")
  if (room.players.length < 2) fail("두 명이 들어와야 시작합니다.")
  if (room.players[0].id !== user.id) fail("먼저 들어온 사람이 시작합니다.")
  room.state = createGame(
    { id: room.players[0].id, name: room.players[0].name },
    { id: room.players[1].id, name: room.players[1].name }
  )
  room.status = "playing"
  return pvpView(touch(room), user)
}

export function actPvp(user, body) {
  const room = pvpRoom(user)
  if (!room?.state) fail("진행 중인 판이 없습니다.")
  place(room.state, user.id, body?.x, body?.y)
  if (room.state.phase === "done") room.status = "lobby"
  return pvpView(touch(room), user)
}
