import React, { useState, useRef, useEffect } from 'react'
import { USERS } from '../config/users'

export default function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (selectedUser) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [selectedUser])

  function handleSelect(user) {
    setSelectedUser(user)
    setPassword('')
    setError(false)
  }

  function handleBack() {
    setSelectedUser(null)
    setPassword('')
    setError(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const ok = onLogin(selectedUser.username, password)
    if (!ok) {
      setError(true)
      setPassword('')
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-8"
      style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #f0fdf4 100%)' }}>

      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3 animate-bounce-soft">🏠</div>
        <h1 className="font-title text-4xl text-blush-400">My Home Haven</h1>
        <p className="font-cute text-sm text-gray-400 mt-1">
          {selectedUser ? `Welcome, ${selectedUser.displayName}!` : "Who's home today? ✨"}
        </p>
      </div>

      {!selectedUser ? (
        /* User selection */
        <div className="w-full max-w-xs space-y-3">
          {USERS.map(u => (
            <button
              key={u.username}
              onClick={() => handleSelect(u)}
              className="w-full flex items-center gap-4 p-4 bg-white rounded-3xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blush-50 to-lavender-100 flex items-center justify-center text-3xl flex-shrink-0">
                {u.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cute font-bold text-gray-700 text-base">{u.displayName}</p>
                <p className="font-cute text-xs text-gray-400 mt-0.5">
                  {u.role === 'admin' ? '✨ Full access' : '🔄 Restock access'}
                </p>
              </div>
              <span className="text-gray-300 text-xl flex-shrink-0">›</span>
            </button>
          ))}
        </div>
      ) : (
        /* Password entry */
        <div className="w-full max-w-xs">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 font-cute text-sm text-gray-400 mb-5 hover:text-gray-600 transition-colors"
          >
            ← Back
          </button>

          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blush-50 to-lavender-100 flex items-center justify-center text-4xl mb-3">
                {selectedUser.avatar}
              </div>
              <p className="font-cute font-bold text-gray-700 text-lg">{selectedUser.displayName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-cute font-bold text-sm text-gray-600 mb-1.5">Password</label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(false) }}
                  placeholder="Enter your password..."
                  autoComplete="current-password"
                  className={`w-full rounded-2xl border-2 px-4 py-3 font-cute focus:outline-none transition-colors ${
                    error
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-lavender-200 bg-lavender-50/50 focus:border-blush-300'
                  }`}
                />
                {error && (
                  <p className="font-cute text-xs text-red-400 mt-1.5">Wrong password, try again 🙈</p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl font-cute font-bold text-white text-base shadow-md bg-gradient-to-r from-blush-300 to-lavender-400 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Let me in! 🏠
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
