import { useState } from 'react'
import { USERS } from '../config/users'

const SESSION_KEY = 'home-haven-session'

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const s = localStorage.getItem(SESSION_KEY)
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  function login(username, password) {
    const found = USERS.find(u => u.username === username && u.password === password)
    if (!found) return false
    const session = {
      username: found.username,
      displayName: found.displayName,
      role: found.role,
      avatar: found.avatar,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return true
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  return { user, login, logout }
}
