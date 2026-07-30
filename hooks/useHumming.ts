"use client"

import { useCallback, useRef, useState } from "react"
import { PitchDetector } from "pitchy"
import { frequencyToMidi, midiToNoteName, transcribe } from "@/lib/music"
import type { NoteEvent } from "@/lib/music"

const ANALYSER_FFT_SIZE = 2048

export type LivePitch = { noteName: string; frequency: number } | null

export const useHumming = () => {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const [livePitch, setLivePitch] = useState<LivePitch>(null)
  const [noteEvents, setNoteEvents] = useState<NoteEvent[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const rafRef = useRef<number | null>(null)
  const detectorRef = useRef<PitchDetector<Float32Array> | null>(null)

  const stopLiveAnalysis = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const runLiveAnalysis = useCallback(() => {
    const analyser = analyserRef.current
    const audioContext = audioContextRef.current
    if (!analyser || !audioContext) return

    const buffer = new Float32Array(analyser.fftSize)
    detectorRef.current ??= PitchDetector.forFloat32Array(analyser.fftSize)

    const tick = () => {
      analyser.getFloatTimeDomainData(buffer)

      let sumSquares = 0
      for (const sample of buffer) sumSquares += sample * sample
      setVolume(Math.sqrt(sumSquares / buffer.length))

      const [frequency, clarity] = detectorRef.current!.findPitch(
        buffer,
        audioContext.sampleRate
      )
      setLivePitch(
        clarity > 0.85 && frequency > 0
          ? {
              noteName: midiToNoteName(frequencyToMidi(frequency)),
              frequency,
            }
          : null
      )

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const start = useCallback(async () => {
    setError(null)
    setNoteEvents(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })
      streamRef.current = stream

      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = ANALYSER_FFT_SIZE
      source.connect(analyser)
      analyserRef.current = analyser

      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorderRef.current = recorder
      recorder.start()

      runLiveAnalysis()
      setIsRecording(true)
    } catch {
      setError("マイクにアクセスできない。ブラウザの権限設定を確認してほしい。")
    }
  }, [runLiveAnalysis])

  const stop = useCallback(async () => {
    const recorder = recorderRef.current
    const audioContext = audioContextRef.current
    if (!recorder || !audioContext) return

    stopLiveAnalysis()
    setVolume(0)
    setLivePitch(null)

    const recordedBlob = await new Promise<Blob>((resolve) => {
      recorder.addEventListener(
        "stop",
        () => resolve(new Blob(chunksRef.current, { type: recorder.mimeType })),
        { once: true }
      )
      recorder.stop()
    })

    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setIsRecording(false)

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer()
      const decoded = await audioContext.decodeAudioData(arrayBuffer)
      const pcm = decoded.getChannelData(0)
      setNoteEvents(transcribe(pcm, decoded.sampleRate))
    } catch {
      setError("録音データの解析に失敗した。")
    } finally {
      await audioContext.close()
      audioContextRef.current = null
    }
  }, [stopLiveAnalysis])

  return { isRecording, volume, livePitch, noteEvents, error, start, stop }
}
