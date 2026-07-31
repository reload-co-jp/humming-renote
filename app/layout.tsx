import { Title } from "@/components/elements/layout"
import "./reset.css"
import styles from "./layout.module.css"

const siteUrl = "https://hrn.reload.co.jp"

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "humming-renote | 鼻歌を楽譜にするアプリ",
    template: "%s | humming-renote",
  },
  description:
    "鼻歌を録音するだけでAIが音程を解析し、五線譜に自動採譜するWebアプリ。インストール不要、ブラウザだけで作曲・耳コピをサポート。",
  keywords: ["鼻歌", "採譜", "楽譜", "作曲", "耳コピ", "五線譜", "音程解析"],
  applicationName: "humming-renote",
  authors: [{ name: "株式会社リロード (Reload, Inc.)" }],
  creator: "株式会社リロード (Reload, Inc.)",
  publisher: "株式会社リロード (Reload, Inc.)",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "humming-renote",
    title: "humming-renote | 鼻歌を楽譜にするアプリ",
    description:
      "鼻歌を録音するだけでAIが音程を解析し、五線譜に自動採譜するWebアプリ。",
  },
  twitter: {
    card: "summary",
    title: "humming-renote | 鼻歌を楽譜にするアプリ",
    description:
      "鼻歌を録音するだけでAIが音程を解析し、五線譜に自動採譜するWebアプリ。",
  },
  robots: {
    index: true,
    follow: true,
  },
}

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="ja">
      <body>
        <header className={styles.header}>
          <Title className={styles.title}>humming-renote</Title>
        </header>
        <main className={styles.main}>{children}</main>
        <footer className={styles.footer}>
          <p>&copy; 株式会社リロード (Reload, Inc.)</p>
        </footer>
      </body>
    </html>
  )
}
export default RootLayout
