let audioCtx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

function beep(freq: number, duration: number, delay = 0, type: OscillatorType = 'sine', volume = 0.15) {
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.value = volume
  osc.connect(gain)
  gain.connect(ctx.destination)
  const startTime = ctx.currentTime + delay
  osc.start(startTime)
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration)
  osc.stop(startTime + duration + 0.02)
}

export function playCorrectSound() {
  beep(880, 0.12, 0)
  beep(1175, 0.16, 0.09)
}

export function playIncorrectSound() {
  beep(220, 0.22, 0, 'sawtooth', 0.09)
}

export function playComboSound() {
  beep(659, 0.1, 0)
  beep(784, 0.1, 0.08)
  beep(988, 0.2, 0.16)
}

export function playWinSound() {
  beep(523, 0.1, 0)
  beep(659, 0.1, 0.08)
  beep(784, 0.1, 0.16)
  beep(1047, 0.35, 0.26)
  beep(1319, 0.35, 0.26, 'sine', 0.1) // held chord on the final note
}

export function playLevelUpSound() {
  beep(523, 0.12, 0)
  beep(659, 0.12, 0.1)
  beep(784, 0.12, 0.2)
  beep(1047, 0.25, 0.3)
}
