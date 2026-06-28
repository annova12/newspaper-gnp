import { useState, useEffect } from 'react'
import { getBreakingNews } from './utils/api'
import { useAllArticles } from './hooks/useArticles'
import { useSettings } from './hooks/useSettings'

import Header from './components/layout/Header'
import ScrollToTop from './components/ui/ScrollToTop'
import SkeletonCard from './components/ui/SkeletonCard'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import AdminPanel from './components/admin/AdminPanel'
import SearchOverlay from './components/ui/SearchOverlay'
import HomePage from './pages/HomePage'

import './styles/globals.css'

export default function App() {
  const { settings } = useSettings()
  const { articles, loading, refetch: refetchArticles } = useAllArticles()
  const [breaking, setBreaking] = useState([])
  const [activeCategory, setActiveCategory] = useState('होम')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  useEffect(() => {
    getBreakingNews().then(setBreaking).catch(() => {})
  }, [])

  // On load, check if URL has ?article=<slug> and auto-open that article
  useEffect(() => {
    if (loading || articles.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const slug = params.get('article')
    if (slug) {
      const found = articles.find((a) => a.slug === slug)
      if (found) setSelectedArticle(found)
    }
  }, [loading, articles])

  const handleAdminClose = () => {
    setShowAdmin(false)
    getBreakingNews().then(setBreaking).catch(() => {})
    refetchArticles()
  }

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat)
    setSelectedArticle(null)
    window.history.pushState({}, '', '/')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleArticleSelect = (article) => {
    setSelectedArticle(article)
    setShowSearch(false)
    window.history.pushState({}, '', `?article=${article.slug}`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleArticleBack = () => {
    setSelectedArticle(null)
    window.history.pushState({}, '', '/')
  }

  // Merge breaking news + article titles for the ticker
  const tickerItems = [
    ...breaking,
    ...articles.slice(0, 10).map((a) => ({ text: a.title })),
  ]

  return (
    <>
      <Header
        settings={settings}
        articles={articles}
        onSearchOpen={() => setShowSearch(true)}
        onAdminOpen={() => setShowAdmin(true)}
      />

      <Navbar
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
      />

      {loading ? (
        <div className="container" style={{ padding: '24px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : (
        <HomePage
          articles={articles}
          settings={settings}
          activeCategory={activeCategory}
          selectedArticle={selectedArticle}
          onArticleSelect={handleArticleSelect}
          onArticleBack={handleArticleBack}
          onCategoryChange={handleCategoryChange}
          tickerItems={tickerItems}
        />
      )}

      <Footer settings={settings} onCategoryChange={handleCategoryChange} />

      <ScrollToTop />

      {showAdmin && <AdminPanel onClose={handleAdminClose} onArticlesChanged={refetchArticles} />}

      {showSearch && (
        <SearchOverlay
          articles={articles}
          onClose={() => setShowSearch(false)}
          onSelect={handleArticleSelect}
        />
      )}
    </>
  )
}
