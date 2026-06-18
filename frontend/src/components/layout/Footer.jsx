import { CATEGORIES, CATEGORY_ICONS } from '../../utils/constants'
import styles from './Footer.module.css'

export default function Footer({ settings, onCategoryChange }) {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <div className={styles.siteName}>{settings.site_name}</div>
            <p className={styles.desc}>
              {settings.site_tagline}। विश्वसनीय, निष्पक्ष और तत्काल समाचार।
            </p>
          </div>

          <div>
            <div className={styles.heading}>श्रेणियां</div>
            <ul className={styles.links}>
              {CATEGORIES.slice(1).map((cat) => (
                <li key={cat} onClick={() => onCategoryChange(cat)}>
                  {CATEGORY_ICONS[cat]} {cat}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className={styles.heading}>संपर्क करें</div>
            <ul className={styles.links}>
              <li>✍️ सम्पादक: शिवकांत श्रीवास्तव</li>
              <li>📧 gunaplushindi@gmail.com</li>
              <li>📞 9425146107</li>
              <li>📍 {settings.site_city}</li>
            </ul>
          </div>

          <div>
            <div className={styles.heading}>हमें फॉलो करें</div>
            <ul className={styles.links}>
              {settings.youtube_channel_id && (
                <li>
                  <a
                    href={
                      settings.youtube_channel_id.startsWith('@')
                        ? `https://youtube.com/${settings.youtube_channel_id}`
                        : `https://youtube.com/channel/${settings.youtube_channel_id}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ▶ YouTube चैनल
                  </a>
                </li>
              )}
              <li>📘 Facebook</li>
              <li>🐦 Twitter / X</li>
            </ul>
          </div>
        </div>

        <div className={styles.bottom}>
          © {new Date().getFullYear()} {settings.site_name} | सभी अधिकार सुरक्षित
        </div>
      </div>
    </footer>
  )
}
