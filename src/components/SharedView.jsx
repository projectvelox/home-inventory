import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function SharedView({ token }) {
  const [items,   setItems]   = useState([])
  const [cats,    setCats]    = useState([])
  const [error,   setError]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [itemsRes, catsRes] = await Promise.allSettled([
        supabase.rpc('get_shared_items', { p_token: token }),
        supabase.from('categories').select('*'),
      ])

      if (itemsRes.status === 'fulfilled' && itemsRes.value.data && !itemsRes.value.error) {
        setItems(itemsRes.value.data)
      } else {
        setError('This link is expired or invalid.')
      }

      if (catsRes.status === 'fulfilled' && catsRes.value.data) {
        setCats(catsRes.value.data)
      }

      setLoading(false)
    }
    load()
  }, [token])

  if (loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fafaf9]">
      <div className="flex flex-col items-center gap-4">
        <div className="text-5xl animate-bounce-soft">🏠</div>
        <div className="w-7 h-7 border-[3px] border-blush-100 border-t-blush-400 rounded-full animate-spin" />
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#fafaf9] p-8 text-center">
      <div className="text-6xl mb-4">🔗</div>
      <h1 className="font-title text-2xl text-blush-400 mb-2">Link Expired</h1>
      <p className="font-sans text-sm text-gray-400">{error}</p>
    </div>
  )

  const grouped = cats
    .map(cat => ({ cat, items: items.filter(i => i.category_id === cat.id) }))
    .filter(g => g.items.length > 0)

  const uncategorized = items.filter(i => !cats.some(c => c.id === i.category_id))
  if (uncategorized.length > 0) {
    grouped.push({ cat: { id: '_other', name: 'Other', emoji: '📦', color: '#94a3b8' }, items: uncategorized })
  }

  return (
    <div className="min-h-[100dvh] bg-[#fafaf9] max-w-lg mx-auto">
      <div className="px-4 pt-8 pb-4 sticky top-0 bg-[#fafaf9]/90 backdrop-blur-md border-b border-gray-100">
        <h1 className="font-title text-3xl text-blush-400">Shopping List</h1>
        <p className="font-sans text-xs text-gray-400 mt-0.5">
          {items.length} {items.length === 1 ? 'item' : 'items'} to restock · My Home Haven
        </p>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center px-8">
          <div className="text-6xl mb-3">✅</div>
          <p className="font-title text-xl text-mint-400">All stocked up!</p>
          <p className="font-sans text-sm text-gray-400 mt-1">Nothing needs restocking right now.</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-5 pb-10">
          {grouped.map(({ cat, items: catItems }) => (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full font-sans font-bold text-sm text-white shadow-sm"
                  style={{ backgroundColor: cat.color }}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.name}</span>
                </div>
              </div>
              <div className="space-y-2">
                {catItems.map(item => {
                  const isEmpty = item.qty === 0
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl shadow-card p-3 flex items-center gap-3 ${isEmpty ? 'ring-2 ring-red-200' : 'ring-1 ring-peach-200'}`}
                    >
                      <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gray-50 flex items-center justify-center text-xl">
                        {cat.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-semibold text-sm text-gray-800 truncate">{item.name}</p>
                        <p className="font-sans text-xs text-gray-400">{item.qty} {item.unit || 'pcs'} left</p>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-sans font-bold text-white ${isEmpty ? 'bg-red-400' : 'bg-peach-400'}`}>
                        {isEmpty ? 'Empty' : 'Low'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
