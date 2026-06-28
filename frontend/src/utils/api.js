import axios from 'axios'

// Use relative URLs so requests go through Vite's proxy (no CORS issues in dev).
// In production, set VITE_API_URL to the backend origin.
export const BASE_URL = import.meta.env.VITE_API_URL || ''

const client = axios.create({ baseURL: BASE_URL })

// Attach JWT on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('np_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login = async (username, password) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await client.post('/api/auth/token', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return data
}

export const getMe = () => client.get('/api/auth/me').then((r) => r.data)

// ── Articles ──────────────────────────────────────────────────────────────────
export const getArticles = (params = {}) =>
  client.get('/api/articles', { params }).then((r) => r.data)

export const getArticleBySlug = (slug) =>
  client.get(`/api/articles/${slug}`).then((r) => r.data)

export const createArticle = (data) =>
  client.post('/api/admin/articles', data).then((r) => r.data)

export const updateArticle = (id, data) =>
  client.put(`/api/admin/articles/${id}`, data).then((r) => r.data)

export const deleteArticle = (id) =>
  client.delete(`/api/admin/articles/${id}`).then((r) => r.data)

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadImage = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return client.post('/api/admin/upload', fd).then((r) => r.data)
}

export const getImageUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${BASE_URL}${path}`
}

// ── Breaking News ─────────────────────────────────────────────────────────────
export const getBreakingNews = () =>
  client.get('/api/breaking-news').then((r) => r.data)

export const createBreakingNews = (text) =>
  client.post('/api/admin/breaking-news', { text }).then((r) => r.data)

export const updateBreakingNews = (id, text) =>
  client.put(`/api/admin/breaking-news/${id}`, { text }).then((r) => r.data)

export const deleteBreakingNews = (id) =>
  client.delete(`/api/admin/breaking-news/${id}`).then((r) => r.data)

// ── YouTube ───────────────────────────────────────────────────────────────────
export const getYoutubeLatest = () =>
  client.get('/api/youtube/latest', { timeout: 20000 }).then((r) => r.data)

// ── Settings ──────────────────────────────────────────────────────────────────
export const getSettings = () =>
  client.get('/api/settings').then((r) => r.data)

export const updateSetting = (key, value) =>
  client.put(`/api/admin/settings/${key}`, { value }).then((r) => r.data)

export default client
