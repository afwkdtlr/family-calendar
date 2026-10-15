export const SIZE = 15

const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

function fail(message) {
  const error = new Error(message)
  error.status = 400
  throw error
}

function at(x, y) {
  return y * SIZE + x
}

function inside(x, y) {
  return x >= 0 && y >= 0 && x < SIZE && y < SIZE
}

export function createGame(black, white) {
  return {
    size: SIZE,
    board: Array(SIZE * SIZE).fill(0),
    turn: 1,
    players: [
      { id: black.id, name: black.name, color: 1, cpu: Boolean(black.cpu) },
      { id: white.id, name: white.name, color: 2, cpu: Boolean(white.cpu) },
    ],
    phase: "play",
    winner: null,
    last: null,
    line: [],
    result: null,
  }
}

function run(board, x, y, dx, dy, color) {
  const cells = []
  let nx = x + dx
  let ny = y + dy
  while (inside(nx, ny) && board[at(nx, ny)] === color) {
    cells.push({ x: nx, y: ny })
    nx += dx
    ny += dy
  }
  const endOpen = inside(nx, ny) && board[at(nx, ny)] === 0
  return { cells, endOpen }
}

export function winningLine(board, x, y) {
  const color = board[at(x, y)]
  if (!color) return []
  for (const [dx, dy] of DIRS) {
    const forward = run(board, x, y, dx, dy, color)
    const back = run(board, x, y, -dx, -dy, color)
    const cells = [{ x, y }, ...forward.cells, ...back.cells]
    if (cells.length >= 5) return cells
  }
  return []
}

function threatScore(board, x, y, color) {
  const index = at(x, y)
  board[index] = color
  let score = 0
  for (const [dx, dy] of DIRS) {
    const forward = run(board, x, y, dx, dy, color)
    const back = run(board, x, y, -dx, -dy, color)
    const count = 1 + forward.cells.length + back.cells.length
    const open = Number(forward.endOpen) + Number(back.endOpen)
    if (count >= 5) score += 100000
    else if (count === 4 && open === 2) score += 12000
    else if (count === 4 && open === 1) score += 2500
    else if (count === 3 && open === 2) score += 900
    else if (count === 3 && open === 1) score += 180
    else if (count === 2 && open === 2) score += 50
    else if (count === 2 && open === 1) score += 12
  }
  board[index] = 0
  return score
}

export function cpuMove(state) {
  const color = state.turn
  const other = color === 1 ? 2 : 1
  let best = null
  let bestScore = -1
  for (let y = 0; y < SIZE; y += 1) {
    for (let x = 0; x < SIZE; x += 1) {
      if (state.board[at(x, y)]) continue
      const mine = threatScore(state.board, x, y, color)
      const theirs = threatScore(state.board, x, y, other)
      const center = 8 - Math.max(Math.abs(x - 7), Math.abs(y - 7))
      const score = mine * 2 + theirs * 1.7 + center
      if (score > bestScore) {
        bestScore = score
        best = { x, y }
      }
    }
  }
  return best
}

export function place(state, playerId, x, y) {
  if (state.phase !== "play") fail("이미 끝난 판입니다.")
  const seat = state.players.find((item) => item.id === playerId)
  if (!seat) fail("이 판의 사람이 아닙니다.")
  if (seat.color !== state.turn) fail("아직 차례가 아닙니다.")
  const px = Number(x)
  const py = Number(y)
  if (!inside(px, py)) fail("판 밖입니다.")
  const index = at(px, py)
  if (state.board[index]) fail("이미 돌이 있습니다.")
  state.board[index] = seat.color
  state.last = { x: px, y: py }
  const line = winningLine(state.board, px, py)
  if (line.length >= 5) {
    state.phase = "done"
    state.winner = seat.color
    state.line = line
    state.result = {
      kind: "win",
      color: seat.color,
      name: seat.name,
      text: `${seat.name} 승리`,
    }
    return state
  }
  if (state.board.every(Boolean)) {
    state.phase = "done"
    state.result = { kind: "draw", text: "무승부입니다." }
    return state
  }
  state.turn = seat.color === 1 ? 2 : 1
  return state
}

export function playCpu(state) {
  if (state.phase !== "play") return state
  const seat = state.players.find((item) => item.color === state.turn)
  if (!seat?.cpu) return state
  const move = cpuMove(state)
  if (!move) return state
  return place(state, seat.id, move.x, move.y)
}

export function present(state, playerId) {
  const me = state.players.find((item) => item.id === playerId) || state.players[0]
  const foe = state.players.find((item) => item !== me)
  return {
    size: state.size,
    board: state.board,
    turn: state.turn,
    phase: state.phase,
    last: state.last,
    line: state.line,
    result: state.result,
    myColor: me.color,
    myTurn: state.phase === "play" && state.turn === me.color,
    me: { id: me.id, name: me.name, color: me.color },
    opp: { id: foe.id, name: foe.name, color: foe.color, cpu: foe.cpu },
  }
}
