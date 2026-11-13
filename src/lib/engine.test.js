import { describe, expect, it } from 'vitest'
import {
  COLS,
  PIECE_KEYS,
  createGameState,
  detectTSpin,
  fillBag,
  hardDrop,
  hold,
  lock,
  makePiece,
  moveHorizontal,
  rotate,
  softDrop,
  spawn,
} from './engine'
import { scoreIsPlausible } from './plausibility'
import { startOfIsoWeekUTC } from './week'
import { dailyGoal, goalMet } from './daily'
import { boostMultiplier } from './boost'

function rngFrom(seed) {
  let a = seed >>> 0
  return function mulberry32() {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function fillRow(state, y) {
  state.board[y] = Array(COLS).fill(1)
}

describe('7-bag randomizer', () => {
  it('deals each piece once per bag, twice across two bags', () => {
    const rng = rngFrom(42)
    let bag = []
    const drawn = []
    for (let i = 0; i < 14; i++) {
      if (bag.length === 0) bag = fillBag(rng)
      drawn.push(bag.pop())
    }
    for (const key of PIECE_KEYS) {
      expect(drawn.filter(k => k === key)).toHaveLength(2)
    }
    expect(new Set(drawn.slice(0, 7)).size).toBe(7)
    expect(new Set(drawn.slice(7)).size).toBe(7)
  })

  it('refills from the same generator inside a live game', () => {
    const state = createGameState(rngFrom(7))
    const seen = []
    for (let i = 0; i < 21; i++) {
      expect(spawn(state)).toBe(true)
      seen.push(state.current.key)
      state.current = null
    }
    for (let start = 0; start < seen.length; start += 7) {
      expect(new Set(seen.slice(start, start + 7)).size).toBe(7)
    }
  })
})

describe('line clears and scoring', () => {
  it('scores a single, a tetris, combo bonus, and level up', () => {
    const state = createGameState(() => 0)
    fillRow(state, 19)
    state.current = makePiece('T')
    state.lastWasRotation = false
    const single = lock(state)
    expect(single.cleared).toBe(1)
    expect(single.tspinKind).toBe('none')
    expect(state.score).toBe(100)
    expect(state.combo).toBe(1)
    expect(state.level).toBe(1)

    for (let y = 16; y <= 19; y++) fillRow(state, y)
    state.current = makePiece('T')
    state.lastWasRotation = false
    const tetris = lock(state)
    expect(tetris.cleared).toBe(4)
    expect(state.tetrises).toBe(1)
    expect(state.lines).toBe(5)
    expect(state.score).toBe(100 + 800 + 50)

    state.lines = 0
    state.level = 1
    for (let n = 0; n < 10; n++) {
      fillRow(state, 19)
      state.current = makePiece('O')
      state.lastWasRotation = false
      lock(state)
    }
    expect(state.lines).toBe(10)
    expect(state.level).toBe(2)
  })

  it('adds soft-drop and hard-drop points outside the line-clear multiplier', () => {
    const state = createGameState(() => 0)
    spawn(state)
    const before = state.score
    const soft = softDrop(state)
    expect(soft.locked).toBe(false)
    expect(state.score).toBe(before + 1)

    const dropped = hardDrop(state)
    expect(dropped.dropped).toBeGreaterThan(0)
    expect(state.score).toBeGreaterThan(before + 1)
  })
})

describe('T-spin detection and scoring', () => {
  function restingT(kind) {
    const state = createGameState(() => 0)
    state.current = makePiece('T', 0)
    state.current.x = 3
    state.current.y = 17
    state.lastWasRotation = true
    state.lastKickIndex = 0
    // Front corners of rotation 0 are the top pair.
    // Piece cells are (4,17), (3,18), (4,18), (5,18).
    state.board[17][3] = 1
    state.board[19][3] = 1
    state.board[19][5] = 1
    if (kind === 'full') state.board[17][5] = 1
    return state
  }

  it('scores a full T-spin with no line clear at 400 × level', () => {
    const state = restingT('full')
    expect(detectTSpin(state)).toBe('full')
    const result = lock(state)
    expect(result.tspinKind).toBe('full')
    expect(result.cleared).toBe(0)
    expect(state.score).toBe(400)
    expect(state.tspins).toBe(1)
    expect(state.btb).toBe(true)
  })

  it('scores a mini T-spin when only one front corner is filled', () => {
    const state = restingT('mini')
    expect(detectTSpin(state)).toBe('mini')
    lock(state)
    expect(state.score).toBe(100)
  })

  it('does not award a T-spin when the last move was not a rotation', () => {
    const state = restingT('full')
    state.lastWasRotation = false
    expect(detectTSpin(state)).toBe('none')
    lock(state)
    expect(state.score).toBe(0)
    expect(state.tspins).toBe(0)
  })

  it('applies the score multiplier and back-to-back bonus', () => {
    const state = restingT('full')
    state.btb = true
    state.scoreMultiplier = boostMultiplier(true)
    lock(state)
    expect(state.score).toBe(1500)
  })

  it('sets lastWasRotation on a successful rotate and clears it after a sideways move', () => {
    const state = createGameState(() => 0)
    state.current = makePiece('T')
    expect(rotate(state)).toBe(true)
    expect(state.lastWasRotation).toBe(true)
    expect(state.current.rotation).toBe(1)
    expect(state.lastKickIndex).toBe(0)
    const xBefore = state.current.x
    expect(moveHorizontal(state, -1)).toBe(true)
    expect(state.lastWasRotation).toBe(false)
    expect(state.current.x).toBe(xBefore - 1)
  })

  it('keeps a zero-distance hard drop as a T-spin lock', () => {
    const state = restingT('full')
    const result = hardDrop(state)
    expect(result.dropped).toBe(0)
    expect(result.tspinKind).toBe('full')
    expect(state.score).toBe(400)
  })
})

describe('hold', () => {
  it('swaps the held piece and cannot hold twice in a row', () => {
    const state = createGameState(() => 0)
    spawn(state)
    const first = state.current.key
    expect(hold(state).held).toBe(true)
    expect(state.holdKey).toBe(first)
    expect(state.current.key).not.toBe(first)
    expect(hold(state).held).toBe(false)
  })
})

describe('score plausibility', () => {
  it('accepts a normal tetris and rejects impossible totals', () => {
    expect(scoreIsPlausible({ score: 800, level: 1, lines: 4, durationSeconds: 30 })).toBe(true)
    expect(scoreIsPlausible({ score: 1_000_000, level: 1, lines: 0, durationSeconds: 1 })).toBe(false)
    expect(scoreIsPlausible({ score: 100, level: 8, lines: 0, durationSeconds: 60 })).toBe(false)
    expect(scoreIsPlausible({ score: 5000, level: 1, lines: 500, durationSeconds: 1 })).toBe(false)
    expect(scoreIsPlausible({ score: 1500, level: 1, lines: 0, durationSeconds: 20 })).toBe(true)
  })
})

describe('weekly reset boundary', () => {
  it('starts the week on Monday 00:00 UTC', () => {
    expect(startOfIsoWeekUTC(new Date('2026-11-11T15:00:00Z')).toISOString()).toBe('2026-11-09T00:00:00.000Z')
    expect(startOfIsoWeekUTC(new Date('2026-11-15T23:30:00Z')).toISOString()).toBe('2026-11-09T00:00:00.000Z')
    expect(startOfIsoWeekUTC(new Date('2026-11-16T00:00:00Z')).toISOString()).toBe('2026-11-16T00:00:00.000Z')
  })
})

describe('daily goal', () => {
  it('is stable for a UTC day', () => {
    const a = dailyGoal(new Date('2026-11-13T00:30:00Z'))
    const b = dailyGoal(new Date('2026-11-13T23:00:00Z'))
    const c = dailyGoal(new Date('2026-11-14T00:00:00Z'))
    expect(a).toEqual(b)
    expect(a.day).toBe('2026-11-13')
    expect(c.day).toBe('2026-11-14')
    expect(goalMet({ type: 'lines', target: 10 }, { lines: 10 })).toBe(true)
    expect(goalMet({ type: 'tspin', target: 1 }, { tspins: 0 })).toBe(false)
  })
})

describe('rewarded boost', () => {
  it('matches the published 1.25× and 2.5× rates', () => {
    expect(boostMultiplier(false)).toBe(1.25)
    expect(boostMultiplier(true)).toBe(2.5)
  })
})
