import { useState, useEffect } from 'react'
import { getSettings } from '../utils/api'

export function useSettings() {
  const [settings, setSettings] = useState({
    site_name: 'Guna Plus',
    site_tagline: 'गुना जिले की विश्वसनीय खबरें',
    site_city: 'गुना, मध्य प्रदेश',
    youtube_channel_id: '@gunaplushindi',
    youtube_embed_id: '',
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSettings()
      .then((data) => setSettings((prev) => ({ ...prev, ...data })))
      .finally(() => setLoading(false))
  }, [])

  return { settings, setSettings, loading }
}
