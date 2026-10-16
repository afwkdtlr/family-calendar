import { createGame, place, playCpu, present } from "./omokEngine.js"

const cpuRooms = new Map()
const STALE_MS = 45000
const rooms = [1, 2, 3].map((id) => ({
  id,
  name: `${id}번방`,
  players: [],
  state: null,
  notice: "",
}))

function fail(message, status = 400) {
  const error = new Error(message)
  error.status = status
  throw error
}

function sweep() {
  const now = Date.now()
  for (const room of rooms) {
    const stale = room.players.filter((player) => now - player.lastSeen >= STALE_MS)
    if (!stale.length) continue
    const hadGame = Boolean(room.state)
    room.players = room.players.filter((player) => now - player.lastSeen < STALE_MS)
    if (hadGame) {
      room.state = null
      room.notice = `${stale.map((player) => player.name).join(", ")} 님이 나갔습니다.`
    }
  }
}

function sameId(left, right) {
  return Number(left) === Number(right)
}

function findSeat(userId) {
  return rooms.find((room) => room.players.some((player) => sameId(player.id, userId))) || null
}

function begin(room) {
  room.state = createGame(
    { id: room.players[0].id, name: room.players[0].name },
    { id: room.players[1].id, name: room.players[1].name }
  )
  room.notice = ""
}

function touchPlayer(room, user) {
  const player = room.players.find((item) => item.id === user.id)
  if (!player) return
  player.lastSeen = Date.now()
  player.name = user.name
}

function publicPlayers(room) {
  return room.players.map((person) => ({ id: person.id, name: person.name }))
}

function pvpPayload(user) {
  const room = findSeat(user.id)
  if (room) touchPlayer(room, user)
  return {
    mode: "pvp",
    rooms: rooms.map((item) => ({
      id: item.id,
      name: item.name,
      status: item.state ? "playing" : "lobby",
      players: publicPlayers(item),
      mine: item.players.some((person) => sameId(person.id, user.id)),
      open: !item.state && item.players.length < 2,
    })),
    roomId: room?.id || null,
    status: room ? (room.state ? "playing" : "lobby") : "pick",
    players: room ? publicPlayers(room) : [],
    me: room?.players.find((person) => sameId(person.id, user.id)) || null,
    host: sameId(room?.players[0]?.id, user.id),
    game: room?.state ? present(room.state, user.id) : null,
    notice: room?.notice || "",
  }
}

export function viewOmok(user, mode) {
  if (mode === "cpu") {
    const room = cpuRooms.get(user.id)
    if (!room) return { mode: "cpu", status: "idle", game: null }
    return { mode: "cpu", status: "playing", game: present(room.state, user.id) }
  }
  sweep()
  return pvpPayload(user)
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

export function joinPvp(user, body) {
  sweep()
  const room = rooms.find((item) => item.id === Number(body?.roomId))
  if (!room) fail("방을 고르세요.")
  const current = findSeat(user.id)
  if (current && sameId(current.id, room.id)) {
    touchPlayer(current, user)
    return pvpPayload(user)
  }
  if (current?.state?.phase === "play") fail("먼저 지금 판에서 나가 주세요.")
  if (current) {
    current.players = current.players.filter((item) => !sameId(item.id, user.id))
    current.state = null
  }
  if (room.state || room.players.length >= 2) fail("이 방은 이미 차고 있습니다.", 409)
  room.players.push({ id: Number(user.id), name: user.name, lastSeen: Date.now() })
  room.notice = ""
  if (room.players.length === 2) begin(room)
  return pvpPayload(user)
}

export function leavePvp(user) {
  sweep()
  const room = findSeat(user.id)
  if (!room) return pvpPayload(user)
  const hadGame = Boolean(room.state)
  room.players = room.players.filter((item) => !sameId(item.id, user.id))
  if (hadGame) {
    room.state = null
    room.notice = `${user.name} 님이 나갔습니다.`
  }
  return pvpPayload(user)
}

export function startPvp(user) {
  sweep()
  const room = findSeat(user.id)
  if (!room) fail("먼저 방에 들어가 주세요.")
  if (room.players.length < 2) fail("두 명이 들어와야 시작합니다.")
  if (!sameId(room.players[0].id, user.id)) fail("먼저 들어온 사람이 시작합니다.")
  if (room.state?.phase === "play") fail("지금 판이 진행 중입니다.")
  begin(room)
  return pvpPayload(user)
}

export function actPvp(user, body) {
  sweep()
  const room = findSeat(user.id)
  if (!room?.state || room.state.phase !== "play") fail("진행 중인 판이 없습니다.")
  place(room.state, user.id, body?.x, body?.y)
  return pvpPayload(user)
}
