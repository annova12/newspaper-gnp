import { useState, useEffect } from 'react'
import { getYoutubeLatest } from '../../utils/api'
import styles from './YouTubeSection.module.css'

// Known video IDs from @gunaplushindi — used instantly while live fetch loads
const FALLBACK_VIDEOS = [
  { video_id: 'hE9vhBoxhAw', title: 'PM आवास कॉलोनी में गोलीबारी — CCTV में कैद वारदात' },
  { video_id: 'zTjkfbRlxaA', title: 'November 28, 2025' },
  { video_id: 'urqagfDmzZ4', title: 'October 10, 2025' },
  { video_id: 'vMhz_-B8yME', title: 'गुना सदर बाजार में भीषण आग' },
  { video_id: 'epMBgheGHwM', title: 'विजयदशमी पर भव्य पथ संचलन' },
  { video_id: '4y_SIzdKGj4', title: 'नगर पालिका कर्मचारियों का विवाद' },
].map((v) => ({
  ...v,
  thumbnail: `https://img.youtube.com/vi/${v.video_id}/hqdefault.jpg`,
  embed_url: `https://www.youtube.com/embed/${v.video_id}?rel=0&modestbranding=1`,
}))

export default function YouTubeSection({ channelId }) {
  // Start with fallback so something shows immediately
  const [videos, setVideos] = useState(FALLBACK_VIDEOS)
  const [activeIdx, setActiveIdx] = useState(0)
  const [refreshing, setRefreshing] = useState(true)

  useEffect(() => {
    getYoutubeLatest()
      .then((data) => {
        if (data.videos?.length) setVideos(data.videos)
      })
      .catch(() => { /* fallback already showing */ })
      .finally(() => setRefreshing(false))
  }, [])

  const channelUrl = channelId?.startsWith('@')
    ? `https://youtube.com/${channelId}`
    : channelId ? `https://youtube.com/channel/${channelId}` : null

  const active = videos[activeIdx]

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.title}>📺 वीडियो न्यूज़</h2>
        {channelUrl && (
          <a className={styles.channelLink} href={channelUrl} target="_blank" rel="noopener noreferrer">
            चैनल देखें →
          </a>
        )}
      </div>

      <div className={styles.embedWrap}>
        <iframe
          key={active.video_id}
          src={active.embed_url}
          allowFullScreen
          title={active.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>

      <div className={styles.playlist}>
        {videos.map((v, i) => (
          <button
            key={v.video_id}
            className={`${styles.thumb} ${i === activeIdx ? styles.thumbActive : ''}`}
            onClick={() => setActiveIdx(i)}
            title={v.title}
          >
            <img src={v.thumbnail} alt={v.title} />
            <span className={styles.thumbTitle}>{v.title}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
