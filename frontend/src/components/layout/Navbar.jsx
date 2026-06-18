import { CATEGORIES, CATEGORY_ICONS } from '../../utils/constants'
import styles from './Navbar.module.css'

export default function Navbar({ activeCategory, onCategoryChange }) {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo pinned at the left of the nav bar */}
        <div className={styles.logoWrap}>
          <img src="/media.jpeg" alt="logo" className={styles.logo} />
        </div>

        <div className={styles.divider} />

        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.item} ${activeCategory === cat ? styles.active : ''}`}
            onClick={() => onCategoryChange(cat)}
          >
            {CATEGORY_ICONS[cat] && (
              <span className={styles.icon}>{CATEGORY_ICONS[cat]}</span>
            )}
            {cat}
          </button>
        ))}
      </div>
    </nav>
  )
}
