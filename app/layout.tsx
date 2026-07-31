import { Title } from "@/components/elements/layout"
import "./reset.css"
import styles from "./layout.module.css"

export const metadata = {
  title: "humming-renote",
  description: "鼻歌を録音して楽譜にするアプリ",
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
          <p>&copy; My organization</p>
        </footer>
      </body>
    </html>
  )
}
export default RootLayout
