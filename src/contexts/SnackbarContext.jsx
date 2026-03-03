import { createContext, useContext, useState, useCallback } from 'react'

const SnackbarContext = createContext(null)

export function SnackbarProvider({ children }) {
  const [message, setMessage] = useState(null)
  const [type, setType] = useState('success')

  const showSuccess = useCallback((msg) => {
    setMessage(msg)
    setType('success')
    setTimeout(() => setMessage(null), 3000)
  }, [])

  const showError = useCallback((msg) => {
    setMessage(msg)
    setType('error')
    setTimeout(() => setMessage(null), 4000)
  }, [])

  return (
    <SnackbarContext.Provider value={{ showSuccess, showError }}>
      {children}
      {message && (
        <div
          className={`snackbar snackbar-${type === 'error' ? 'error' : 'success'}`}
          role="status"
        >
          {message}
        </div>
      )}
    </SnackbarContext.Provider>
  )
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext)
  return ctx || { showSuccess: () => {}, showError: () => {} }
}
