import { useState, useEffect } from 'react'
import { getSettings, updateSetting } from '../../utils/api'
import { useToast } from '../../context/ToastContext'
import styles from './AdminSettings.module.css'

const FIELDS = [
  { key: 'site_name', label: 'Site Name (साइट का नाम)', placeholder: 'मेरा समाचार' },
  { key: 'site_tagline', label: 'Tagline', placeholder: 'आपका विश्वसनीय समाचार स्रोत' },
  { key: 'site_city', label: 'City (शहर)', placeholder: 'आपका शहर, मध्य प्रदेश' },
  {
    key: 'youtube_channel_id',
    label: 'YouTube Channel ID / Handle',
    placeholder: '@yourchannel या UCxxxxxxxxxxxxxxxxxx',
    hint: 'Channel link के लिए — footer में दिखेगा (e.g. @gunaplushindi)',
  },
  {
    key: 'youtube_embed_id',
    label: 'YouTube Embed — Video या Playlist ID',
    placeholder: 'dQw4w9WgXcQ या PLxxxxxxxxxx',
    hint: 'Homepage पर embed के लिए: किसी video का ID (URL में ?v= के बाद) या Playlist ID (PL से शुरू)',
  },
]

export default function AdminSettings() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState({})
  const [saving, setSaving] = useState({})

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const handleSave = async (key) => {
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await updateSetting(key, settings[key] || '')
      showToast('Setting saved', 'success')
    } catch {
      showToast('Save failed', 'error')
    } finally {
      setSaving((s) => ({ ...s, [key]: false }))
    }
  }

  return (
    <div>
      <h3 className={styles.heading}>⚙️ Site Settings</h3>

      {FIELDS.map((field) => (
        <div key={field.key} className={styles.field}>
          <label className={styles.label}>{field.label}</label>
          {field.hint && <p className={styles.hint}>{field.hint}</p>}
          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={settings[field.key] || ''}
              placeholder={field.placeholder}
              onChange={(e) =>
                setSettings((s) => ({ ...s, [field.key]: e.target.value }))
              }
            />
            <button
              className={styles.saveBtn}
              onClick={() => handleSave(field.key)}
              disabled={saving[field.key]}
            >
              {saving[field.key] ? '...' : 'Save'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
