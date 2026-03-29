import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ShareModal({ user, onClose }) {
  const [token, setToken]   = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied]   = useState(false)

  useEffect(() => { loadToken() }, [])

  async function loadToken() {
    setLoading(true)
    const { data } = await supabase
      .from('share_tokens')
      .select('token, created_at, expires_at')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    setToken(data ?? null)
    setLoading(false)
  }

  async function generate() {
    setLoading(true)
    const { data } = await supabase
      .from('share_tokens')
      .insert([{ created_by: user.id, label: 'Shopping list' }])
      .select()
      .single()
    setToken(data ?? null)
    setLoading(false)
  }

  async function revoke() {
    if (!token) return
    await supabase.from('share_tokens').delete().eq('token', token.token)
    setToken(null)
  }

  async function newLink() {
    setLoading(true)
    await supabase.from('share_tokens').delete().eq('created_by', user.id)
    const { data } = await supabase
      .from('share_tokens')
      .insert([{ created_by: user.id, label: 'Shopping list' }])
      .select()
      .single()
    setToken(data ?? null)
    setLoading(false)
  }

  const shareUrl = token ? `${window.location.origin}/?share=${token.token}` : ''

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function nativeShare() {
    if (navigator.share) {
      navigator.share({ title: 'Shopping List — My Home Haven', url: shareUrl }).catch(() => {})
    } else {
      copyLink()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-modal animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-title text-2xl text-blush-400">Share Shopping List</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">✕</button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-blush-100 border-t-blush-400 rounded-full animate-spin" />
            </div>
          ) : token ? (
            <div className="space-y-4">
              <div className="bg-lavender-50 dark:bg-lavender-500/10 rounded-2xl p-4 border border-lavender-100 dark:border-lavender-500/20">
                <p className="font-sans text-xs font-bold text-lavender-400 mb-2">Shareable link</p>
                <p className="font-sans text-xs text-gray-600 dark:text-gray-300 break-all font-mono leading-relaxed">{shareUrl}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={copyLink}
                  className={`py-3 rounded-2xl font-sans font-bold text-sm transition-all ${
                    copied
                      ? 'bg-mint-50 dark:bg-mint-500/10 text-mint-500 border border-mint-200 dark:border-mint-500/30'
                      : 'bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500 border border-lavender-200 dark:border-lavender-500/30 hover:bg-lavender-100'
                  }`}
                >{copied ? '✓ Copied!' : '📋 Copy Link'}</button>
                <button
                  onClick={nativeShare}
                  className="py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all"
                >📤 Share</button>
              </div>

              <p className="font-sans text-xs text-center text-gray-400">
                Anyone with this link can view your current low-stock list — no login needed
              </p>

              <div className="flex gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                <button onClick={newLink} className="flex-1 py-2 rounded-xl font-sans text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
                  🔄 New link
                </button>
                <button onClick={revoke} className="flex-1 py-2 rounded-xl font-sans text-xs text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
                  🚫 Revoke
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="text-5xl">🔗</div>
              <p className="font-sans text-sm text-gray-500 dark:text-gray-400">
                Generate a link anyone can open — no login required
              </p>
              <button
                onClick={generate}
                className="px-8 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow"
              >Generate Link</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
