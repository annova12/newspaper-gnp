import { formatDateShort } from '../../utils/constants'
import WeatherWidget from '../ui/WeatherWidget'
import QuickPoll from '../ui/QuickPoll'
import styles from './Sidebar.module.css'

export default function Sidebar({ articles, onArticleClick }) {
  const trending = articles.slice(0, 8)

  return (
    <aside className={styles.sidebar}>

      {/* Live weather */}
      <WeatherWidget />

      {/* Trending articles */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>🔥 ताज़ा खबरें</div>
        {trending.map((article, i) => (
          <div
            key={article.id}
            className={styles.trendingItem}
            onClick={() => onArticleClick(article)}
          >
            <span className={styles.num}>{String(i + 1).padStart(2, '0')}</span>
            <div>
              <div className={styles.trendingTitle}>{article.title}</div>
              <div className={styles.trendingMeta}>
                {article.category} • {formatDateShort(article.published_at)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick poll */}
      <QuickPoll />

    </aside>
  )
}
