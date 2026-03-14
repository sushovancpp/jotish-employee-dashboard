import { createContext, useContext, useState } from 'react'

// ─── Constants ───────────────────────────────────────────────
const STORAGE_KEY  = 'eid_auth_user'
const VALID_USER   = import.meta.env.VITE_LOGIN_USERNAME
const VALID_PASS   = import.meta.env.VITE_LOGIN_PASSWORD

// ─── Context ─────────────────────────────────────────────────
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Rehydrate session from localStorage on mount
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  /**
   * Validate credentials and persist the session.
   * Returns true on success, false on failure.
   */
  const login = (username, password) => {
    if (username === VALID_USER && password === VALID_PASS) {
      const session = { username, loggedAt: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      setUser(session)
      return true
    }
    return false
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
