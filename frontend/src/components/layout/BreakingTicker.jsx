import styles from './BreakingTicker.module.css'

export default function BreakingTicker({ items = [] }) {
  if (!items.length) return null

  // Double items so the scroll loops seamlessly
  const doubled = [...items, ...items]

  return (
    <div className={styles.wrap}>
      <div className={styles.label}>
        <span className={styles.pulse} />
        ब्रेकिंग न्यूज़
      </div>
      <div className={styles.track}>
        <div className={styles.content}>
          {doubled.map((item, i) => (
            <span key={i} className={styles.item}>
              <span className={styles.dot}>◆</span>
              {item.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
