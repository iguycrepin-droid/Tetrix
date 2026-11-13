import { loadSettings } from './settings'

let ctx = null
let master = null
let timer = null

function context() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.1
  master.connect(ctx.destination)
  return ctx
}

function blip(freq, time, dur, type, vol) {
  const ac = context()
  if (!ac || !master) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1400
  osc.type = type
  osc.frequency.value = freq
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(master)
  gain.gain.setValueAtTime(vol, time)
  gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
  osc.start(time)
  osc.stop(time + dur + 0.02)
}

export function musicContext() {
  return context()
}

export function startMusic() {
  const settings = loadSettings()
  if (!settings.musicOn) {
    stopMusic()
    return
  }
  const ac = context()
  if (!ac) return
  if (ac.state === 'suspended') ac.resume().catch(() => {})
  if (timer) return
  const pattern = [0, 7, 3, 10, 7, 3, 0, 5]
  let step = 0
  timer = setInterval(() => {
    const live = loadSettings()
    if (!live.musicOn) {
      stopMusic()
      return
    }
    if (!ctx || !master) return
    master.gain.value = Math.max(0.0001, (live.musicVol ?? 0.6) * 0.16)
    const t = ctx.currentTime
    const semis = pattern[step % pattern.length]
    const note = 110 * Math.pow(2, semis / 12)
    blip(note, t, 0.2, 'sawtooth', 0.08)
    if (step % 2 === 0) blip(note / 2, t, 0.32, 'triangle', 0.1)
    if (step % 8 === 0) blip(note * 2, t, 0.12, 'square', 0.04)
    step++
  }, 280)
}

export function stopMusic() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  if (master) master.gain.value = 0.0001
}
