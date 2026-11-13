export const COLS = 10
export const ROWS = 20
export const PIECE_KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
export const LINE_SCORES = [0, 100, 300, 500, 800]
export const SPEED_TABLE = [800, 700, 600, 500, 420, 350, 280, 220, 170, 130, 100, 80, 65, 55, 45, 38, 32, 27, 22, 18, 15]

const COLOR_INDEX = { I: 0, O: 1, T: 2, S: 3, Z: 4, J: 5, L: 6 }

// SRS rotation states. y grows downward.
const SHAPES = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
}

// Wall kicks with y positive down (SRS wiki offsets, y negated).
const KICKS_JLSTZ = {
  '0>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1>0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1>2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2>1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3>2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3>0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0>3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
}

const KICKS_I = {
  '0>1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1>0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1>2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2>1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2>3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3>2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3>0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0>3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
}

const T_FRONTS = {
  0: [[0, 0], [2, 0]],
  1: [[2, 0], [2, 2]],
  2: [[0, 2], [2, 2]],
  3: [[0, 0], [0, 2]],
}

export function fillBag(rng = Math.random) {
  const bag = PIECE_KEYS.slice()
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const swap = bag[i]
    bag[i] = bag[j]
    bag[j] = swap
  }
  return bag
}

export function shapeOf(piece) {
  return SHAPES[piece.key][piece.rotation]
}

export function previewShape(key) {
  return SHAPES[key][0]
}

export function colorIndex(key) {
  return COLOR_INDEX[key]
}

function spawnX(key) {
  return Math.floor((COLS - SHAPES[key][0][0].length) / 2)
}

export function makePiece(key, rotation = 0) {
  return { key, rotation, x: spawnX(key), y: 0, color: COLOR_INDEX[key] }
}

function newGameId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `game-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createGameState(rng = Math.random) {
  const bag = fillBag(rng)
  return {
    board: Array.from({ length: ROWS }, () => Array(COLS).fill(0)),
    current: null,
    holdKey: null,
    next: [bag.pop(), bag.pop(), bag.pop()],
    bag,
    score: 0,
    level: 1,
    lines: 0,
    combo: 0,
    maxCombo: 0,
    btb: false,
    canHold: true,
    scoreMultiplier: 1,
    lastWasRotation: false,
    lastKickIndex: 0,
    tetrises: 0,
    tspins: 0,
    lineFlashUntil: 0,
    dropAcc: 0,
    lastTime: 0,
    startTime: Date.now(),
    clientGameId: newGameId(),
    rng,
  }
}

export function collides(state, x, y, shape) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const nx = x + c
      const ny = y + r
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true
      if (ny >= 0 && state.board[ny][nx]) return true
    }
  }
  return false
}

function pullKey(state) {
  if (state.bag.length === 0) state.bag = fillBag(state.rng)
  return state.bag.pop()
}

export function spawn(state) {
  const key = state.next.shift()
  state.next.push(pullKey(state))
  state.current = makePiece(key)
  state.canHold = true
  state.lastWasRotation = false
  return !collides(state, state.current.x, state.current.y, shapeOf(state.current))
}

export function ghostY(state) {
  if (!state.current) return null
  const shape = shapeOf(state.current)
  let y = state.current.y
  while (!collides(state, state.current.x, y + 1, shape)) y++
  return y
}

export function moveHorizontal(state, dir) {
  const piece = state.current
  if (!piece) return false
  if (collides(state, piece.x + dir, piece.y, shapeOf(piece))) return false
  piece.x += dir
  state.lastWasRotation = false
  return true
}

function basePoints(cleared, tspinKind) {
  if (tspinKind === 'full') return [400, 800, 1200, 1600][cleared] || 0
  if (tspinKind === 'mini') return [100, 200, 400][cleared] || 0
  return LINE_SCORES[cleared] || 0
}

function cornerFilled(state, x, y) {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return true
  return state.board[y][x] !== 0
}

/** 'none' | 'mini' | 'full'. Three-corner rule; the 5th SRS kick still counts as a full T-spin. */
export function detectTSpin(state) {
  const piece = state.current
  if (!piece || piece.key !== 'T' || !state.lastWasRotation) return 'none'
  const corners = [[0, 0], [2, 0], [0, 2], [2, 2]]
  const filled = corners.filter(([dx, dy]) => cornerFilled(state, piece.x + dx, piece.y + dy)).length
  if (filled < 3) return 'none'
  const fronts = T_FRONTS[piece.rotation]
  const frontFilled = fronts.every(([dx, dy]) => cornerFilled(state, piece.x + dx, piece.y + dy))
  if (frontFilled || state.lastKickIndex === 4) return 'full'
  return 'mini'
}

export function lock(state) {
  const piece = state.current
  if (!piece) return { toppedOut: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  const shape = shapeOf(piece)
  const tspinKind = detectTSpin(state)
  const painted = []
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue
      const x = piece.x + c
      const y = piece.y + r
      if (y < 0) {
        state.current = null
        return { toppedOut: true, cleared: 0, tspinKind: 'none', leveledUp: false }
      }
      painted.push([x, y])
    }
  }
  for (const [x, y] of painted) state.board[y][x] = piece.color + 1
  state.current = null
  state.lastWasRotation = false

  let cleared = 0
  for (let r = ROWS - 1; r >= 0; r--) {
    if (state.board[r].every(cell => cell !== 0)) {
      state.board.splice(r, 1)
      state.board.unshift(Array(COLS).fill(0))
      cleared++
      r++
    }
  }

  const leveledBefore = state.level
  if (cleared === 0) {
    state.combo = 0
    if (tspinKind !== 'none') {
      const base = basePoints(0, tspinKind) * state.level
      const btbBonus = state.btb ? Math.floor(base * 0.5) : 0
      state.score += Math.floor((base + btbBonus) * (state.scoreMultiplier || 1))
      state.btb = true
      state.tspins++
    }
  } else {
    state.combo++
    if (state.combo > state.maxCombo) state.maxCombo = state.combo
    const base = basePoints(cleared, tspinKind) * state.level
    const comboBonus = state.combo > 1 ? (state.combo - 1) * 50 : 0
    const difficult = cleared === 4 || tspinKind !== 'none'
    const btbBonus = difficult && state.btb ? Math.floor(base * 0.5) : 0
    state.score += Math.floor((base + comboBonus + btbBonus) * (state.scoreMultiplier || 1))
    state.lines += cleared
    state.btb = difficult
    if (cleared === 4) state.tetrises++
    if (tspinKind !== 'none') state.tspins++
    state.level = Math.min(20, Math.floor(state.lines / 10) + 1)
  }

  return {
    toppedOut: false,
    cleared,
    tspinKind,
    leveledUp: state.level > leveledBefore,
  }
}

function lockAndSpawn(state) {
  const result = lock(state)
  if (result.toppedOut) return { ...result, topped: true }
  const spawned = spawn(state)
  return { ...result, topped: !spawned }
}

export function rotate(state, dir = 1) {
  const piece = state.current
  if (!piece || piece.key === 'O') return false
  const from = piece.rotation
  const to = (from + (dir < 0 ? 3 : 1)) % 4
  const kicks = (piece.key === 'I' ? KICKS_I : KICKS_JLSTZ)[`${from}>${to}`]
  const shape = SHAPES[piece.key][to]
  for (let i = 0; i < kicks.length; i++) {
    const [dx, dy] = kicks[i]
    const nx = piece.x + dx
    const ny = piece.y + dy
    if (!collides(state, nx, ny, shape)) {
      piece.x = nx
      piece.y = ny
      piece.rotation = to
      state.lastWasRotation = true
      state.lastKickIndex = i
      return true
    }
  }
  return false
}

export function softDrop(state) {
  const piece = state.current
  if (!piece) return { locked: false, topped: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  if (!collides(state, piece.x, piece.y + 1, shapeOf(piece))) {
    piece.y++
    state.score += 1
    state.lastWasRotation = false
    return { locked: false, topped: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  }
  const result = lockAndSpawn(state)
  return { locked: true, ...result }
}

export function hardDrop(state) {
  const piece = state.current
  if (!piece) return { locked: false, topped: false, dropped: 0, cleared: 0, tspinKind: 'none', leveledUp: false }
  let dropped = 0
  while (!collides(state, piece.x, piece.y + 1, shapeOf(piece))) {
    piece.y++
    dropped++
  }
  state.score += dropped * 2
  if (dropped > 0) state.lastWasRotation = false
  const result = lockAndSpawn(state)
  return { locked: true, dropped, ...result }
}

export function hold(state) {
  if (!state.current || !state.canHold) return { held: false, topped: false }
  const incoming = state.holdKey
  state.holdKey = state.current.key
  state.lastWasRotation = false
  if (incoming) {
    state.current = makePiece(incoming)
    state.canHold = false
    return { held: true, topped: collides(state, state.current.x, state.current.y, shapeOf(state.current)) }
  }
  const spawned = spawn(state)
  state.canHold = false
  return { held: true, topped: !spawned }
}

export function tick(state, dt) {
  if (!state.current) return { locked: false, topped: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  state.dropAcc += dt
  const speed = SPEED_TABLE[Math.min(state.level - 1, SPEED_TABLE.length - 1)]
  if (state.dropAcc < speed) {
    return { locked: false, topped: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  }
  state.dropAcc -= speed
  const piece = state.current
  if (!collides(state, piece.x, piece.y + 1, shapeOf(piece))) {
    piece.y++
    state.lastWasRotation = false
    return { locked: false, topped: false, cleared: 0, tspinKind: 'none', leveledUp: false }
  }
  const result = lockAndSpawn(state)
  return { locked: true, ...result }
}
