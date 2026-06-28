import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import AdminLogin from './AdminLogin'
import AdminArticles from './AdminArticles'
import AdminBreaking from './AdminBreaking'
import AdminSettings from './AdminSettings'
import styles from './AdminPanel.module.css'

const NAV_TABS = [
  { id: 'articles', label: '📰 Articles' },
  { id: 'breaking', label: '🔴 Breaking News' },
  { id: 'settings', label: '⚙️ Settings' },
]

export default function AdminPanel({ onClose, onArticlesChanged }) {
  const { user, logoutUser } = useAuth()
  const [tab, setTab] = useState('articles')

  const handleLogout = () => {
    logoutUser()
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.panel}>
        {/* Header */}
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>🛡️ Admin Panel</h2>
          <div className={styles.headerActions}>
            {user && (
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Logout
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        {!user ? (
          <div className={styles.loginWrap}>
            <AdminLogin />
          </div>
        ) : (
          <div className={styles.body}>
            {/* Sidebar Nav */}
            <nav className={styles.nav}>
              {NAV_TABS.map((t) => (
                <button
                  key={t.id}
                  className={`${styles.navItem} ${tab === t.id ? styles.navActive : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className={styles.content}>
              {tab === 'articles' && <AdminArticles onArticlesChanged={onArticlesChanged} />}
              {tab === 'breaking' && <AdminBreaking />}
              {tab === 'settings' && <AdminSettings />}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
