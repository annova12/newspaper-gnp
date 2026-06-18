import { useState, useEffect, useCallback } from 'react'
import { getArticles } from '../utils/api'
import { DUMMY_ARTICLES } from '../utils/dummyData'

export function useArticles(params = {}) {
  const [articles, setArticles] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getArticles(params)
      setArticles(data.articles)
      setTotal(data.total)
    } catch {
      setArticles(DUMMY_ARTICLES)
      setTotal(DUMMY_ARTICLES.length)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { fetchArticles() }, [fetchArticles])

  return { articles, total, loading, error, refetch: fetchArticles }
}

export function useAllArticles() {
  return useArticles({ limit: 100 })
}
