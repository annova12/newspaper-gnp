import { useState, useEffect } from 'react'
import {
  getBreakingNews,
  createBreakingNews,
  updateBreakingNews,
  deleteBreakingNews,
} from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import styles from './AdminBreaking.module.css'

export default function AdminBreaking() {
  const { showToast } = useToast()
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await getBreakingNews()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!text.trim()) return
    try {
      if (editId) await updateBreakingNews(editId, text)
      else await createBreakingNews(text)
      setText('')
      setEditId(null)
      load()
      showToast('Saved', 'success')
    } catch {
      showToast('Save failed', 'error')
    }
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setText(item.text)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this breaking news?')) return
    await deleteBreakingNews(id)
    load()
    showToast('Deleted', 'success')
  }

  return (
    <div>
      <h3 className={styles.heading}>🔴 Breaking News Ticker</h3>
      <p className={styles.desc}>These items scroll across the red ticker at the top of the site.</p>

      <div className={styles.addForm}>
        <input
          className={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter breaking news text..."
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        />
        <div className={styles.formActions}>
          <button className={styles.saveBtn} onClick={handleSave}>
            {editId ? 'Update' : 'Add'}
          </button>
          {editId && (
            <button className={styles.cancelBtn} onClick={() => { setEditId(null); setText('') }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className={styles.list}>
          {items.map((item) => (
            <div key={item.id} className={styles.item}>
              <span className={styles.dot}>🔴</span>
              <span className={styles.itemText}>{item.text}</span>
              <div className={styles.itemActions}>
                <button className={styles.editBtn} onClick={() => handleEdit(item)}>Edit</button>
                <button className={styles.deleteBtn} onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p style={{ color: 'var(--gray)', fontSize: 13, padding: '10px 0' }}>
              No breaking news items yet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
