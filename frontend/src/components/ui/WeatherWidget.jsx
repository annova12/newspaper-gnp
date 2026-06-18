import { useState, useEffect } from 'react'
import styles from './WeatherWidget.module.css'

const WMO = {
  0: { label: 'साफ आसमान', icon: '☀️' },
  1: { label: 'लगभग साफ', icon: '🌤️' },
  2: { label: 'आंशिक बादल', icon: '⛅' },
  3: { label: 'बादल छाए', icon: '☁️' },
  45: { label: 'कोहरा', icon: '🌫️' },
  48: { label: 'कोहरा', icon: '🌫️' },
  51: { label: 'हल्की बूंदें', icon: '🌦️' },
  61: { label: 'हल्की बारिश', icon: '🌧️' },
  63: { label: 'मध्यम बारिश', icon: '🌧️' },
  65: { label: 'तेज बारिश', icon: '⛈️' },
  80: { label: 'बौछार', icon: '🌦️' },
  95: { label: 'तूफान', icon: '⛈️' },
}

export default function WeatherWidget() {
  const [wx, setWx] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=24.65&longitude=77.31' +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code' +
      '&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Kolkata&forecast_days=1'
    )
      .then((r) => r.json())
      .then((d) => setWx({
        temp: Math.round(d.current.temperature_2m),
        humidity: d.current.relative_humidity_2m,
        wind: Math.round(d.current.wind_speed_10m),
        code: d.current.weather_code,
        max: Math.round(d.daily.temperature_2m_max[0]),
        min: Math.round(d.daily.temperature_2m_min[0]),
      }))
      .catch(() => setError(true))
  }, [])

  const info = wx ? (WMO[wx.code] || { label: 'मौसम', icon: '🌡️' }) : null

  return (
    <div className={styles.card}>
      <div className={styles.title}>🌤️ मौसम — गुना, म.प्र.</div>

      {!wx && !error && <div className={styles.loading}>लोड हो रहा है…</div>}
      {error && <div className={styles.loading}>मौसम उपलब्ध नहीं</div>}

      {wx && (
        <>
          <div className={styles.main}>
            <span className={styles.icon}>{info.icon}</span>
            <div>
              <div className={styles.temp}>{wx.temp}°C</div>
              <div className={styles.condition}>{info.label}</div>
            </div>
          </div>

          <div className={styles.range}>
            <span>↑ {wx.max}°</span>
            <span>↓ {wx.min}°</span>
          </div>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statIcon}>💧</span>
              <span>{wx.humidity}%</span>
              <span className={styles.statLabel}>नमी</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statIcon}>💨</span>
              <span>{wx.wind} km/h</span>
              <span className={styles.statLabel}>हवा</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
