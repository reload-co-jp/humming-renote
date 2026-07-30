"use client"

import { useCallback, useRef, useState } from "react"
import { midiToFrequency } from "@/lib/music"
import type { NoteEvent } from "@/lib/music"

const NOTE_GAP_RATIO = 0.85
const FADE_SECONDS = 0.02

export const usePlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const stopTimeoutRef = useRef<number | null>(null)

  const stop = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }
    audioContextRef.current?.close()
    audioContextRef.current = null
    setIsPlaying(false)
  }, [])

  const play = useCallback(
    (noteEvents: NoteEvent[]) => {
      if (noteEvents.length === 0) return
      stop()

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      setIsPlaying(true)

      let time = audioContext.currentTime
      for (const event of noteEvents) {
        const noteDuration = event.duration * NOTE_GAP_RATIO
        const oscillator = audioContext.createOscillator()
        const gain = audioContext.createGain()
        oscillator.frequency.value = midiToFrequency(event.midi)
        oscillator.connect(gain)
        gain.connect(audioContext.destination)

        gain.gain.setValueAtTime(0, time)
        gain.gain.linearRampToValueAtTime(0.3, time + FADE_SECONDS)
        gain.gain.setValueAtTime(
          0.3,
          time + Math.max(noteDuration - FADE_SECONDS, FADE_SECONDS)
        )
        gain.gain.linearRampToValueAtTime(0, time + noteDuration)

        oscillator.start(time)
        oscillator.stop(time + noteDuration)
        time += event.duration
      }

      const totalDuration = noteEvents.reduce(
        (sum, event) => sum + event.duration,
        0
      )
      stopTimeoutRef.current = window.setTimeout(() => {
        stop()
      }, totalDuration * 1000)
    },
    [stop]
  )

  return { isPlaying, play, stop }
}
