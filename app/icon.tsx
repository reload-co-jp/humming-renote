import { ImageResponse } from "next/og"

export const dynamic = "force-static"
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

const Icon = () =>
  new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14161c",
          color: "#e2c078",
          fontSize: 22,
        }}
      >
        ♪
      </div>
    ),
    { ...size }
  )

export default Icon
