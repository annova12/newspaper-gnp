import { useState, useEffect } from 'react'
import { formatDate } from '../../utils/constants'
import styles from './SearchOverlay.module.css'

export default function SearchOverlay({ articles, onClose, onSelect }) {
  const [query, setQuery] = useState('')

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const results =
    query.length > 1
      ? articles
          .filter(
            (a) =>
              a.title.includes(query) ||
              a.excerpt?.includes(query) ||
              a.category.includes(query)
          )
          .slice(0, 8)
      : []

  return (
    <div
      className={styles.overlay}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className={styles.box}>
        <div className={styles.inputRow}>
          <span className={styles.icon}>🔍</span>
          <input
            className={styles.input}
            autoFocus
            placeholder="समाचार खोजें..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {query.length > 1 && (
          <div className={styles.results}>
            {results.length ? (
              results.map((a) => (
                <div
                  key={a.id}
                  className={styles.resultItem}
                  onClick={() => { onSelect(a); onClose() }}
                >
                  <div className={styles.resultTitle}>{a.title}</div>
                  <div className={styles.resultMeta}>
                    {a.category} • {formatDate(a.published_at)}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.empty}>कोई परिणाम नहीं मिला</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
