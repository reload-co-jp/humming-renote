"use client"

import { FC, useEffect, useRef } from "react"
import { Renderer, Stave, StaveNote, Voice, Formatter, VexFlow } from "vexflow"
import type { NoteEvent } from "@/lib/music"
import styles from "./staff.module.css"

type Props = {
  noteEvents: NoteEvent[]
}

const STAVE_WIDTH = 600
const STAVE_HEIGHT = 150

// SMuFL音楽フォント(Bravura)はFontFace APIで非同期に読み込まれるため、
// 完了を待たずに描画すると符頭等が代替フォントになり文字化けする。
// FontFace APIはブラウザのみのためuseEffect内(クライアント側)で遅延初期化する。
let fontsReady: Promise<void> | null = null
const getFontsReady = () => (fontsReady ??= VexFlow.loadFonts("Bravura", "Academico"))

const drawStaff = (container: HTMLDivElement, noteEvents: NoteEvent[]) => {
  const renderer = new Renderer(container, Renderer.Backends.SVG)
  renderer.resize(STAVE_WIDTH, STAVE_HEIGHT)
  const context = renderer.getContext()

  const stave = new Stave(10, 20, STAVE_WIDTH - 20)
  stave.addClef("treble")
  stave.setContext(context).draw()

  const staveNotes = noteEvents.map(
    (event) =>
      new StaveNote({ keys: [event.vexKey], duration: event.vexDuration }),
  )
  const totalBeats = noteEvents.reduce((sum, event) => sum + event.vexBeats, 0)

  const voice = new Voice({ numBeats: Math.max(totalBeats, 1), beatValue: 4 })
  voice.setStrict(false)
  voice.addTickables(staveNotes)

  new Formatter().joinVoices([voice]).format([voice], STAVE_WIDTH - 60)
  voice.draw(context, stave)
}

export const Staff: FC<Props> = ({ noteEvents }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.innerHTML = ""

    if (noteEvents.length === 0) return

    let cancelled = false
    getFontsReady().then(() => {
      if (cancelled) return
      drawStaff(container, noteEvents)
    })
    return () => {
      cancelled = true
    }
  }, [noteEvents])

  return (
    <div
      ref={containerRef}
      className={styles.staff}
      style={{ background: "#fff", borderRadius: 4, overflowX: "auto" }}
    />
  )
}
