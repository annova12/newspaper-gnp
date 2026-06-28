import { useState } from 'react'
import { deleteArticle } from '../../utils/api'
import { useAllArticles } from '../../hooks/useArticles'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/constants'
import ArticleForm from './ArticleForm'
import styles from './AdminArticles.module.css'

export default function AdminArticles({ onArticlesChanged }) {
  const { articles, loading, refetch } = useAllArticles()
  const { showToast } = useToast()
  const [view, setView] = useState('list') // 'list' | 'new' | 'edit'
  const [editingArticle, setEditingArticle] = useState(null)

  const handleEdit = (article) => {
    setEditingArticle(article)
    setView('edit')
  }

  const handleDelete = async (article) => {
    if (!confirm(`Delete "${article.title}"?`)) return
    try {
      await deleteArticle(article.id)
      showToast('Article deleted', 'success')
      refetch()
      onArticlesChanged?.()
    } catch {
      showToast('Delete failed', 'error')
    }
  }

  const handleSave = () => {
    setView('list')
    setEditingArticle(null)
    refetch()
    onArticlesChanged?.()
  }

  const handleCancel = () => {
    setView('list')
    setEditingArticle(null)
  }

  if (view === 'new' || view === 'edit') {
    return (
      <ArticleForm
        article={editingArticle}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    )
  }

  return (
    <div>
      <div className={styles.topBar}>
        <h3 className={styles.heading}>
          📰 Articles ({articles.length})
        </h3>
        <button className={styles.newBtn} onClick={() => setView('new')}>
          + New Article
        </button>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Featured</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className={styles.articleTitle}>{a.title}</div>
                  </td>
                  <td>
                    <span className={styles.catBadge}>{a.category}</span>
                  </td>
                  <td>
                    {a.is_featured ? (
                      <span className={styles.featuredBadge}>⭐ Featured</span>
                    ) : (
                      <span className={styles.dash}>—</span>
                    )}
                  </td>
                  <td className={styles.date}>{formatDate(a.published_at)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.editBtn}
                        onClick={() => handleEdit(a)}
                      >
                        Edit
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(a)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
