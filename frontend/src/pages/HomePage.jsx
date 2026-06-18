import YouTubeSection from '../components/news/YouTubeSection'
import BreakingTicker from '../components/layout/BreakingTicker'
import ArticleCard from '../components/news/ArticleCard'
import ArticleView from '../components/news/ArticleView'
import CategorySection from '../components/news/CategorySection'
import Sidebar from '../components/news/Sidebar'
import { CONTENT_CATEGORIES, CATEGORY_ICONS } from '../utils/constants'
import styles from './HomePage.module.css'

export default function HomePage({
  articles,
  settings,
  activeCategory,
  selectedArticle,
  onArticleSelect,
  onArticleBack,
  onCategoryChange,
  tickerItems = [],
}) {
  const featuredArticles = articles.filter((a) => a.is_featured)
  const heroArticles = featuredArticles.length ? featuredArticles : articles
  const articlesByCategory = (cat) =>
    articles.filter((a) => a.category === cat).slice(0, 3)

  const sidebar = (
    <Sidebar
      articles={articles}
      onArticleClick={onArticleSelect}
      onCategoryChange={onCategoryChange}
    />
  )

  // ── Article reading view ──────────────────────────────────────────────────
  if (selectedArticle) {
    return (
      <div className="container">
        <div className={styles.articleLayout}>
          <div className={styles.articleMain}>
            <ArticleView article={selectedArticle} onBack={onArticleBack} />
          </div>
          {sidebar}
        </div>
      </div>
    )
  }

  // ── Listing view ──────────────────────────────────────────────────────────
  return (
    <div className="container">
      <div className={styles.layout}>
        <main className={styles.main}>
          {/* YouTube always first */}
          <YouTubeSection channelId={settings.youtube_channel_id} />

          {/* Rolling news ticker, right after the YouTube row */}
          <BreakingTicker items={tickerItems} />

          {activeCategory === 'होम' ? (
            <>
              {/* Featured / Hero articles */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>प्रमुख खबरें</h2>
                <div className={styles.featuredGrid}>
                  {heroArticles.slice(0, 6).map((article, i) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      onClick={onArticleSelect}
                      size={i === 0 ? 'large' : 'normal'}
                      index={i}
                    />
                  ))}
                </div>
              </section>

              {/* Per-category sections */}
              {CONTENT_CATEGORIES.filter(
                (cat) => articlesByCategory(cat).length > 0
              ).map((cat) => (
                <CategorySection
                  key={cat}
                  category={cat}
                  articles={articlesByCategory(cat)}
                  onArticleClick={onArticleSelect}
                  onMoreClick={onCategoryChange}
                />
              ))}
            </>
          ) : (
            /* Single category view */
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>
                {CATEGORY_ICONS[activeCategory]} {activeCategory}
              </h2>
              {articles.filter((a) => a.category === activeCategory).length ? (
                <div className={styles.featuredGrid}>
                  {articles
                    .filter((a) => a.category === activeCategory)
                    .map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onClick={onArticleSelect}
                      />
                    ))}
                </div>
              ) : (
                <p className={styles.empty}>
                  इस श्रेणी में अभी कोई समाचार नहीं है।
                </p>
              )}
            </section>
          )}
        </main>

        {sidebar}
      </div>
    </div>
  )
}
