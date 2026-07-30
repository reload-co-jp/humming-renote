import { PitchDetector } from "pitchy"

export type NoteEvent = {
  midi: number
  noteName: string
  vexKey: string
  vexDuration: string
  vexBeats: number
  startTime: number
  duration: number
  clarity: number
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
]

/** 周波数(Hz)→MIDIノート番号(小数含む、A4=69=440Hz基準) */
export const frequencyToMidi = (frequency: number): number =>
  69 + 12 * Math.log2(frequency / 440)

export const midiToNoteName = (midi: number): string => {
  const rounded = Math.round(midi)
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12]
  const octave = Math.floor(rounded / 12) - 1
  return `${name}${octave}`
}

/** VexFlowのkey表記(例: "c#/4")へ変換 */
export const noteNameToVexKey = (noteName: string): string => {
  const match = noteName.match(/^([A-G]#?)(-?\d+)$/)
  if (!match) return "c/4"
  const [, name, octave] = match
  return `${name.toLowerCase()}/${octave}`
}

type QuantizedDuration = { vexDuration: string; beats: number }

const DURATION_TABLE: QuantizedDuration[] = [
  { vexDuration: "w", beats: 4 },
  { vexDuration: "h", beats: 2 },
  { vexDuration: "q", beats: 1 },
  { vexDuration: "8", beats: 0.5 },
  { vexDuration: "16", beats: 0.25 },
]

/** 秒単位の長さをテンポ(BPM)に応じ最も近い音価へスナップ */
export const quantizeDuration = (
  durationSec: number,
  bpm: number
): QuantizedDuration => {
  const beats = (durationSec * bpm) / 60
  return DURATION_TABLE.reduce((closest, candidate) =>
    Math.abs(candidate.beats - beats) < Math.abs(closest.beats - beats)
      ? candidate
      : closest
  )
}

type RawPitchFrame = {
  time: number
  midi: number
  clarity: number
}

const CLARITY_THRESHOLD = 0.85
const MIN_FREQUENCY = 80
const MAX_FREQUENCY = 1200
const MIN_NOTE_DURATION = 0.08
const SEMITONE_MERGE_TOLERANCE = 0.7

/**
 * PCM波形からノートイベント列を抽出する。
 * hopSize毎にPitchyでフレーム解析→半音単位でまとめてオンセット/オフセットを検出する。
 */
export const transcribe = (
  pcm: Float32Array,
  sampleRate: number,
  {
    frameSize = 2048,
    hopSize = 512,
    bpm = 120,
  }: { frameSize?: number; hopSize?: number; bpm?: number } = {}
): NoteEvent[] => {
  const detector = PitchDetector.forFloat32Array(frameSize)
  detector.clarityThreshold = CLARITY_THRESHOLD

  const frames: RawPitchFrame[] = []
  for (let offset = 0; offset + frameSize <= pcm.length; offset += hopSize) {
    const frame = pcm.subarray(offset, offset + frameSize)
    const [frequency, clarity] = detector.findPitch(frame, sampleRate)
    if (
      clarity < CLARITY_THRESHOLD ||
      frequency < MIN_FREQUENCY ||
      frequency > MAX_FREQUENCY
    ) {
      continue
    }
    frames.push({
      time: offset / sampleRate,
      midi: frequencyToMidi(frequency),
      clarity,
    })
  }

  const events: NoteEvent[] = []
  let current: { midiSum: number; count: number; clarity: number } | null = null
  let currentStart = 0
  let currentEnd = 0

  const flush = () => {
    if (!current) return
    const duration = currentEnd - currentStart
    if (duration >= MIN_NOTE_DURATION) {
      const midi = Math.round(current.midiSum / current.count)
      const noteName = midiToNoteName(midi)
      const { vexDuration, beats } = quantizeDuration(duration, bpm)
      events.push({
        midi,
        noteName,
        vexKey: noteNameToVexKey(noteName),
        vexDuration,
        vexBeats: beats,
        startTime: currentStart,
        duration: (beats * 60) / bpm,
        clarity: current.clarity / current.count,
      })
    }
    current = null
  }

  const hopDuration = hopSize / sampleRate
  for (const frame of frames) {
    const roundedMidi = Math.round(frame.midi)
    if (
      current &&
      Math.abs(roundedMidi - current.midiSum / current.count) <=
        SEMITONE_MERGE_TOLERANCE &&
      frame.time - currentEnd <= hopDuration * 1.5
    ) {
      current.midiSum += roundedMidi
      current.count += 1
      current.clarity += frame.clarity
      currentEnd = frame.time + hopDuration
      continue
    }
    flush()
    current = { midiSum: roundedMidi, count: 1, clarity: frame.clarity }
    currentStart = frame.time
    currentEnd = frame.time + hopDuration
  }
  flush()

  return events
}
