import { useState } from 'react'
import { CATEGORY_ICONS, formatDate } from '../../utils/constants'
import { getImageUrl } from '../../utils/api'
import { useInView } from '../../hooks/useInView'
import styles from './ArticleCard.module.css'

function getSaved() {
  try { return JSON.parse(localStorage.getItem('np_saved') || '[]') } catch { return [] }
}

export default function ArticleCard({ article, onClick, size = 'normal', index = 0 }) {
  const imgUrl = getImageUrl(article.thumbnail)
  const icon = CATEGORY_ICONS[article.category] || '📰'
  const [saved, setSaved] = useState(() => getSaved().includes(article.id))
  const [ref, inView] = useInView()

  const toggleSave = (e) => {
    e.stopPropagation()
    const list = getSaved()
    const next = saved ? list.filter((id) => id !== article.id) : [...list, article.id]
    localStorage.setItem('np_saved', JSON.stringify(next))
    setSaved(!saved)
  }

  return (
    <article
      ref={ref}
      className={`${styles.card} ${size === 'large' ? styles.large : ''} ${inView ? styles.visible : ''}`}
      style={{ animationDelay: `${index * 80}ms` }}
      onClick={() => onClick(article)}
    >
      <div className={styles.imageWrap}>
        {imgUrl ? (
          <img className={styles.image} src={imgUrl} alt={article.title} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>{icon}</div>
        )}

        {/* hover read overlay */}
        <div className={styles.overlay}>
          <span className={styles.overlayText}>पढ़ें →</span>
        </div>

        <span className={styles.catBadge}>{article.category}</span>
        <button
          className={`${styles.bookmark} ${saved ? styles.bookmarkSaved : ''}`}
          onClick={toggleSave}
          title={saved ? 'सेव किया हुआ' : 'सेव करें'}
        >
          {saved ? '🔖' : '🏷️'}
        </button>
      </div>

      <div className={styles.body}>
        <h3 className={styles.title}>{article.title}</h3>
        {article.excerpt && <p className={styles.excerpt}>{article.excerpt}</p>}
        <div className={styles.meta}>
          <span>✍️ {article.author}</span>
          <span>📅 {formatDate(article.published_at)}</span>
        </div>
      </div>
    </article>
  )
}
