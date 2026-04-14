// ─── context/AuthContext.jsx ──────────────────────────────────────────────────
// Global login state. Stores token, name, and _id.
// _id is needed by the socket for joining the right chat room.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)

  // On page load: restore login from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token')
    const name  = localStorage.getItem('name')
    const _id   = localStorage.getItem('_id')
    if (token && name) setUser({ token, name, _id })
  }, [])

  const login = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('name',  data.name)
    if (data._id) localStorage.setItem('_id', data._id)
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('name')
    localStorage.removeItem('_id')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
