import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && <Toast message={toast.message} type={toast.type} />}
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

function Toast({ message, type }) {
  const colors = {
    success: '#27ae60',
    error: '#C0392B',
    info: '#2980b9',
  }
  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      background: colors[type] || colors.info,
      color: '#fff',
      padding: '12px 20px',
      borderRadius: 8,
      fontSize: 14,
      fontWeight: 600,
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,.3)',
      animation: 'fadeInUp .3s ease',
      maxWidth: 320,
    }}>
      {message}
    </div>
  )
}
