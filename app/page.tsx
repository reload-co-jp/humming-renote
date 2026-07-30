"use client"

import { FC } from "react"
import { useHumming } from "@/hooks/useHumming"
import { Staff } from "@/components/elements/staff"

const Page: FC = () => {
  const { isRecording, volume, livePitch, noteEvents, error, start, stop } =
    useHumming()

  return (
    <div
      style={{
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <button onClick={isRecording ? stop : start}>
        {isRecording ? "録音停止" : "録音開始"}
      </button>

      {isRecording && (
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem" }}>
          <div style={{ background: "#444", height: 8, width: 200 }}>
            <div
              style={{
                background: "#4caf50",
                height: "100%",
                width: `${Math.min(volume * 400, 100)}%`,
              }}
            />
          </div>
          <p>
            {livePitch
              ? `${livePitch.noteName} (${livePitch.frequency.toFixed(1)} Hz)`
              : "-"}
          </p>
        </div>
      )}

      {error && <p style={{ color: "#f66" }}>{error}</p>}

      {noteEvents && (
        <div>
          <p>採譜結果 ({noteEvents.length}音)</p>
          {noteEvents.length > 0 ? (
            <Staff noteEvents={noteEvents} />
          ) : (
            <p>音程を検出できなかった。もう一度録音してほしい。</p>
          )}
        </div>
      )}
    </div>
  )
}

export default Page
