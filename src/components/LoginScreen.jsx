import React, { useState, useRef, useEffect } from 'react'
import { USERS } from '../config/users'

export default function LoginScreen({ onLogin }) {
  const [selectedUser, setSelectedUser] = useState(null)
  const [password,     setPassword]     = useState('')
  const [error,        setError]        = useState(null)
  const [submitting,   setSubmitting]   = useState(false)
  const inputRef = useRef()

  useEffect(() => {
    if (selectedUser) setTimeout(() => inputRef.current?.focus(), 100)
  }, [selectedUser])

  function handleSelect(user) { setSelectedUser(user); setPassword(''); setError(false) }
  function handleBack()       { setSelectedUser(null); setPassword(''); setError(null) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedUser.email) { setError('Account not set up yet — contact admin.'); return }
    setSubmitting(true)
    const errorMsg = await onLogin(selectedUser.email, password)
    setSubmitting(false)
    if (errorMsg) { setError('Wrong password, try again 🙈'); setPassword('') }
  }

  const admins  = USERS.filter(u => u.role === 'admin')
  const helpers = USERS.filter(u => u.role === 'helper')

  return (
    <div
      className="min-h-[100dvh] flex flex-col items-center justify-center px-5 py-10"
      style={{ background: 'linear-gradient(160deg, #fdf2f8 0%, #f3e8ff 45%, #f0fdf4 100%)' }}
    >
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-2.5 animate-bounce-soft">🏠</div>
        <h1 className="font-title text-4xl text-blush-400 leading-none">My Home Haven</h1>
        <p className="font-sans text-sm text-gray-400 mt-1.5">
          {selectedUser ? `Hi, ${selectedUser.displayName}! 👋` : "Who's home today? ✨"}
        </p>
      </div>

      {!selectedUser ? (
        <div className="w-full max-w-sm space-y-4">
          {/* Admin row */}
          {admins.map(u => (
            <button
              key={u.id}
              onClick={() => handleSelect(u)}
              className="w-full flex items-center gap-4 px-4 py-3.5 bg-white rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.015] active:scale-[0.98] transition-all text-left ring-1 ring-blush-100"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blush-100 to-lavender-100 flex items-center justify-center text-2xl flex-shrink-0">
                {u.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-gray-800 text-sm leading-tight">{u.displayName}</p>
                <span className="inline-block mt-0.5 font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-blush-50 text-blush-400 border border-blush-100">
                  Admin
                </span>
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">›</span>
            </button>
          ))}

          {/* Divider */}
          {helpers.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <p className="font-sans text-xs font-semibold text-gray-400">Members</p>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Helpers grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {helpers.map(u => (
              <button
                key={u.id}
                onClick={() => handleSelect(u)}
                className="flex flex-col items-center gap-2.5 px-3 py-4 bg-white rounded-2xl shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.97] transition-all ring-1 ring-gray-100"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-lavender-50 to-mint-50 flex items-center justify-center text-3xl">
                  {u.avatar}
                </div>
                <div className="text-center">
                  <p className="font-sans font-semibold text-gray-700 text-sm leading-tight">{u.displayName}</p>
                  <span className="font-sans text-[10px] text-lavender-400 font-medium">Member</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      ) : (
        <div className="w-full max-w-xs">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 font-sans text-sm text-gray-400 mb-5 hover:text-gray-600 transition-colors"
          >‹ Back</button>

          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blush-50 to-lavender-100 flex items-center justify-center text-4xl mb-3">
                {selectedUser.avatar}
              </div>
              <p className="font-sans font-bold text-gray-700 text-lg leading-snug">{selectedUser.displayName}</p>
              <span className={`mt-1 font-sans text-[10px] font-bold px-2.5 py-0.5 rounded-full ${selectedUser.role === 'admin' ? 'bg-blush-50 text-blush-400 border border-blush-100' : 'bg-lavender-50 text-lavender-400 border border-lavender-100'}`}>
                {selectedUser.role === 'admin' ? 'Admin' : 'Member'}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-sans font-semibold text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="Enter your password…"
                  autoComplete="current-password"
                  disabled={submitting}
                  className={`w-full rounded-2xl border-2 px-4 py-3 font-sans text-sm focus:outline-none transition-colors ${
                    error
                      ? 'border-red-300 bg-red-50 focus:border-red-400'
                      : 'border-lavender-200 bg-lavender-50/30 focus:border-blush-300 focus:bg-white'
                  }`}
                />
                {error && <p className="font-sans text-xs text-red-400 mt-1.5">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl font-sans font-bold text-white text-sm shadow-md bg-gradient-to-r from-blush-300 to-lavender-400 hover:shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
                  : '🏠 Let me in!'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
