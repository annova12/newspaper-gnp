import { useState } from 'react'
import { createArticle, updateArticle, uploadImage, getImageUrl } from '../../utils/api'
import { CONTENT_CATEGORIES, slugify } from '../../utils/constants'
import { useToast } from '../../context/ToastContext'
import styles from './ArticleForm.module.css'

export default function ArticleForm({ article, onSave, onCancel }) {
  const { showToast } = useToast()
  const isEdit = !!article?.id

  const [form, setForm] = useState({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    content: article?.content || '',
    thumbnail: article?.thumbnail || '',
    category: article?.category || CONTENT_CATEGORIES[0],
    author: article?.author || 'संपादक',
    is_featured: article?.is_featured || false,
  })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const handleTitleChange = (value) => {
    set('title', value)
    if (!isEdit) set('slug', slugify(value))
  }

  const handleImageUpload = async (file) => {
    if (!file) return
    setUploading(true)
    try {
      const data = await uploadImage(file)
      set('thumbnail', data.url)
      showToast('Image uploaded', 'success')
    } catch {
      showToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      showToast('Title and content are required', 'error')
      return
    }
    setSaving(true)
    try {
      if (isEdit) await updateArticle(article.id, form)
      else await createArticle(form)
      showToast(isEdit ? 'Article updated' : 'Article created', 'success')
      onSave()
    } catch (err) {
      showToast(err.response?.data?.detail || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const thumbUrl = form.thumbnail
    ? form.thumbnail.startsWith('http')
      ? form.thumbnail
      : getImageUrl(form.thumbnail)
    : null

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>
        {isEdit ? '✏️ Edit Article' : '➕ New Article'}
      </h3>

      <div className={styles.group}>
        <label className={styles.label}>Title (शीर्षक) *</label>
        <input
          className={styles.input}
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Article title..."
        />
      </div>

      <div className={styles.row}>
        <div className={styles.group}>
          <label className={styles.label}>Category (श्रेणी) *</label>
          <select
            className={styles.input}
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {CONTENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className={styles.group}>
          <label className={styles.label}>Author (लेखक)</label>
          <input
            className={styles.input}
            value={form.author}
            onChange={(e) => set('author', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Excerpt (सारांश)</label>
        <input
          className={styles.input}
          value={form.excerpt}
          onChange={(e) => set('excerpt', e.target.value)}
          placeholder="Short description..."
        />
      </div>

      <div className={styles.group}>
        <label className={styles.label}>Content (सामग्री) *</label>
        <textarea
          className={styles.textarea}
          rows={9}
          value={form.content}
          onChange={(e) => set('content', e.target.value)}
          placeholder="Write full article content here..."
        />
      </div>

      {/* Thumbnail */}
      <div className={styles.group}>
        <label className={styles.label}>Thumbnail Image</label>
        <div
          className={styles.uploadArea}
          onClick={() => document.getElementById('img-file-input').click()}
        >
          {uploading ? '⏳ Uploading...' : '📁 Click to upload image'}
        </div>
        <input
          id="img-file-input"
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleImageUpload(e.target.files[0])}
        />
        <input
          className={styles.input}
          style={{ marginTop: 8 }}
          placeholder="...or paste image URL"
          value={form.thumbnail}
          onChange={(e) => set('thumbnail', e.target.value)}
        />
        {thumbUrl && (
          <img className={styles.thumbPreview} src={thumbUrl} alt="Preview" />
        )}
      </div>

      <div className={styles.group}>
        <label className={styles.label}>URL Slug</label>
        <input
          className={styles.input}
          value={form.slug}
          onChange={(e) => set('slug', e.target.value)}
          placeholder="auto-generated-from-title"
        />
      </div>

      <label className={styles.checkRow}>
        <input
          type="checkbox"
          checked={form.is_featured}
          onChange={(e) => set('is_featured', e.target.checked)}
        />
        ⭐ Featured Article (appears prominently on homepage)
      </label>

      <div className={styles.actions}>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : '💾 Save Article'}
        </button>
        <button className={styles.cancelBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}
