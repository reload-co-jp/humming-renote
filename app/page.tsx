"use client"

import { FC } from "react"
import { useHumming } from "@/hooks/useHumming"
import { usePlayback } from "@/hooks/usePlayback"
import { Staff } from "@/components/elements/staff"
import styles from "./page.module.css"

const Page: FC = () => {
  const { isRecording, volume, livePitch, noteEvents, error, start, stop } =
    useHumming()
  const playback = usePlayback()

  return (
    <div className={styles.page}>
      <button
        className={`${styles.recordButton} ${isRecording ? styles.recording : ""}`}
        onClick={isRecording ? stop : start}
      >
        {isRecording ? "録音停止" : "録音開始"}
      </button>

      {isRecording && (
        <div className={styles.meterCard}>
          <div className={styles.meterTrack}>
            <div
              className={styles.meterFill}
              style={{ width: `${Math.min(volume * 400, 100)}%` }}
            />
          </div>
          <p className={styles.pitchLabel}>
            {livePitch
              ? `${livePitch.noteName} (${livePitch.frequency.toFixed(1)} Hz)`
              : "-"}
          </p>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {noteEvents && (
        <div className={styles.resultCard}>
          <p className={styles.resultTitle}>採譜結果 ({noteEvents.length}音)</p>
          {noteEvents.length > 0 ? (
            <>
              <Staff noteEvents={noteEvents} />
              <button
                className={styles.playButton}
                onClick={() =>
                  playback.isPlaying
                    ? playback.stop()
                    : playback.play(noteEvents)
                }
              >
                {playback.isPlaying ? "再生停止" : "再生"}
              </button>
            </>
          ) : (
            <p>音程を検出できなかった。もう一度録音してほしい。</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Page
