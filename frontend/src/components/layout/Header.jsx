import { useState, useEffect } from 'react'
import styles from './Header.module.css'

function useDarkMode() {
  const [dark, setDark] = useState(() => localStorage.getItem('np_theme') === 'dark')
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '')
    localStorage.setItem('np_theme', dark ? 'dark' : 'light')
  }, [dark])
  return [dark, setDark]
}

export default function Header({ settings, articles = [], onSearchOpen, onAdminOpen }) {
  const [dark, setDark] = useDarkMode()
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }))

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }))
    }, 30000)
    return () => clearInterval(t)
  }, [])

  const dateStr = new Date().toLocaleDateString('hi-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  const headlines = articles.slice(0, 5)

  return (
    <header className={styles.header}>

      {/* top utility bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarInner}>
          <span className={styles.date}>🕐 {time} &nbsp;|&nbsp; {dateStr}</span>
          <div className={styles.actions}>
            <button
              className={styles.darkBtn}
              onClick={() => setDark(!dark)}
              title={dark ? 'Light mode' : 'Dark mode'}
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <button className={styles.searchBtn} onClick={onSearchOpen}>🔍 खोजें</button>
            <button className={styles.adminBtn} onClick={onAdminOpen}>Admin</button>
          </div>
        </div>
      </div>

      {/* brand banner image */}
      <div className={styles.brand}>
        <img src="/media-banner.jpeg" alt={settings.site_name || 'गुना प्लस'} className={styles.brandImg} />
      </div>

      {/* headline strip */}
      {headlines.length > 0 && (
        <div className={styles.headlineStrip}>
          <div className={styles.headlineInner}>
            {headlines.map((a, i) => (
              <span key={a.id ?? i} className={styles.headline}>
                <span className={styles.bullet}>◆</span>
                {a.title}
              </span>
            ))}
          </div>
        </div>
      )}

    </header>
  )
}
