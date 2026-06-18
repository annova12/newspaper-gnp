import styles from './SkeletonCard.module.css'

export default function SkeletonCard() {
  return (
    <div className={styles.card}>
      <div className={styles.image} />
      <div className={styles.body}>
        <div className={`${styles.line} ${styles.title}`} />
        <div className={`${styles.line} ${styles.mid}`} />
        <div className={`${styles.line} ${styles.short}`} />
      </div>
    </div>
  )
}
