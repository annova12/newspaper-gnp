import { useState, useEffect, useRef } from 'react'
import { getImageUrl } from '../../utils/api'
import { formatDate } from '../../utils/constants'
import styles from './ArticleView.module.css'

export default function ArticleView({ article, onBack }) {
  const imgUrl = getImageUrl(article.thumbnail)
  const [progress, setProgress] = useState(0)
  const [copied, setCopied] = useState(false)
  const wrapRef = useRef(null)

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current
      if (!el) return
      const { top, height } = el.getBoundingClientRect()
      const viewH = window.innerHeight
      const read = Math.max(0, Math.min(1, (-top + viewH) / (height + viewH)))
      setProgress(Math.round(read * 100))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: article.title, url })
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`${article.title}\n${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <>
      {/* fixed reading progress bar at top */}
      <div className={styles.progressBar} style={{ width: `${progress}%` }} />

      <div className={styles.wrap} ref={wrapRef}>
        <button className={styles.backBtn} onClick={onBack}>← वापस जाएं</button>

        <div className={styles.catLabel}>{article.category}</div>
        <h1 className={styles.title}>{article.title}</h1>

        <div className={styles.meta}>
          <span>✍️ {article.author}</span>
          <span>📅 {formatDate(article.published_at)}</span>
        </div>

        {imgUrl && (
          <img className={styles.thumbnail} src={imgUrl} alt={article.title} />
        )}

        <div
          className={styles.content}
          dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }}
        />

        {/* share bar */}
        <div className={styles.shareBar}>
          <span className={styles.shareLabel}>शेयर करें:</span>
          <button className={styles.waBtn} onClick={handleWhatsApp}>
            📲 WhatsApp
          </button>
          <button className={styles.copyBtn} onClick={handleShare}>
            {copied ? '✅ कॉपी हुआ!' : '🔗 लिंक कॉपी करें'}
          </button>
        </div>
      </div>
    </>
  )
}
