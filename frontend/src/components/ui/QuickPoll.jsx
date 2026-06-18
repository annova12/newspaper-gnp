import { useState, useEffect } from 'react'
import styles from './QuickPoll.module.css'

const POLLS = [
  {
    id: 'poll_1',
    question: 'आपको किस तरह की खबरें सबसे ज्यादा पसंद हैं?',
    options: ['राजनीति', 'खेल', 'मनोरंजन', 'स्वास्थ्य'],
  },
  {
    id: 'poll_2',
    question: 'गुना के विकास में सबसे जरूरी क्या है?',
    options: ['सड़कें', 'शिक्षा', 'रोजगार', 'स्वास्थ्य सेवा'],
  },
]

const POLL = POLLS[Math.floor(Date.now() / 86400000) % POLLS.length]

function getVotes() {
  try { return JSON.parse(localStorage.getItem(`np_${POLL.id}`) || 'null') } catch { return null }
}

export default function QuickPoll() {
  const [voted, setVoted] = useState(() => getVotes())
  const [counts, setCounts] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`np_${POLL.id}_counts`) || 'null') } catch { return null }
  })
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (voted !== null) setAnimate(true)
  }, [voted])

  const vote = (idx) => {
    if (voted !== null) return
    const base = counts || POLL.options.map(() => Math.floor(Math.random() * 40 + 10))
    const next = [...base]
    next[idx] += 1
    localStorage.setItem(`np_${POLL.id}`, JSON.stringify(idx))
    localStorage.setItem(`np_${POLL.id}_counts`, JSON.stringify(next))
    setVoted(idx)
    setCounts(next)
    setTimeout(() => setAnimate(true), 50)
  }

  const total = counts ? counts.reduce((a, b) => a + b, 0) : 0

  return (
    <div className={styles.card}>
      <div className={styles.title}>📊 त्वरित सर्वे</div>
      <p className={styles.question}>{POLL.question}</p>

      <div className={styles.options}>
        {POLL.options.map((opt, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0
          const isVoted = voted === i

          return voted === null ? (
            <button key={i} className={styles.optBtn} onClick={() => vote(i)}>
              {opt}
            </button>
          ) : (
            <div key={i} className={`${styles.result} ${isVoted ? styles.resultVoted : ''}`}>
              <div className={styles.resultTop}>
                <span>{opt}</span>
                <span className={styles.pct}>{pct}%</span>
              </div>
              <div className={styles.barTrack}>
                <div
                  className={styles.bar}
                  style={{ width: animate ? `${pct}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {voted !== null && (
        <div className={styles.thanks}>
          ✅ आपका वोट दर्ज हुआ! कुल {total} वोट
        </div>
      )}
    </div>
  )
}
