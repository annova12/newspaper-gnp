import { useState } from 'react'
import { login } from '../../utils/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const { loginUser } = useAuth()
  const { showToast } = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(username, password)
      loginUser(data.access_token, {
        username: data.username || username,
        is_admin: data.is_admin,
      })
      showToast('Login successful', 'success')
    } catch (err) {
      showToast(err.response?.data?.detail || 'Login failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrap}>
      <h3 className={styles.heading}>🔐 Admin Login</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.group}>
          <label className={styles.label}>Username</label>
          <input
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className={styles.group}>
          <label className={styles.label}>Password</label>
          <input
            className={styles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className={styles.submitBtn} type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  )
}
