import ArticleCard from './ArticleCard'
import { CATEGORY_ICONS } from '../../utils/constants'
import styles from './CategorySection.module.css'

export default function CategorySection({ category, articles, onArticleClick, onMoreClick }) {
  if (!articles.length) return null

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          {CATEGORY_ICONS[category]} {category}
        </h2>
        <button className={styles.moreBtn} onClick={() => onMoreClick(category)}>
          और पढ़ें »
        </button>
      </div>

      <div className={styles.grid}>
        {articles.map((article, i) => (
          <ArticleCard
            key={article.id}
            article={article}
            onClick={onArticleClick}
            index={i}
          />
        ))}
      </div>
    </section>
  )
}
