import React from 'react'

export default function ShoppingList({ items, categories, onUpdateQty }) {
  function getCategoryById(id) {
    return categories.find(c => c.id === id)
  }

  function share() {
    const lines = items.map(item => {
      const cat = getCategoryById(item.categoryId)
      const emoji = cat?.emoji ?? '📦'
      const status = item.qty === 0 ? '(empty)' : `(${item.qty} left)`
      return `${emoji} ${item.name} ${status}`
    })
    const text = `🛒 Shopping List — ${new Date().toLocaleDateString()}\n\n${lines.join('\n')}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard! 📋'))
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-title text-2xl text-mint-400 mb-2">All stocked up!</h2>
        <p className="font-cute text-gray-400 text-sm">No items need restocking right now.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <p className="font-cute text-sm text-gray-400 font-semibold">
          {items.length} {items.length === 1 ? 'item' : 'items'} to buy
        </p>
        <button
          onClick={share}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl font-cute font-bold text-sm text-white bg-gradient-to-r from-mint-400 to-lavender-400 shadow hover:shadow-md hover:scale-105 transition-all"
        >
          <span>📤</span>
          <span>Share</span>
        </button>
      </div>

      <div className="space-y-2">
        {items.map(item => {
          const cat = getCategoryById(item.categoryId)
          const isEmpty = item.qty === 0
          return (
            <div key={item.id} className={`bg-white rounded-2xl shadow-sm p-3 flex items-center gap-3 ${isEmpty ? 'ring-2 ring-red-200' : 'ring-2 ring-peach-200'}`}>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blush-50 to-lavender-50 flex items-center justify-center">
                {item.image ? (
                  <img src={item.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{cat?.emoji ?? '📦'}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-cute font-bold text-gray-700 text-sm truncate">{item.name}</h3>
                  <span className={`text-xs font-cute font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${isEmpty ? 'bg-red-400' : 'bg-peach-400'}`}>
                    {isEmpty ? 'Empty!' : 'Low!'}
                  </span>
                </div>
                {cat && <p className="text-xs font-cute font-semibold mt-0.5" style={{ color: cat.color }}>{cat.emoji} {cat.name}</p>}
                {item.location && <p className="text-xs font-cute text-gray-400">📍 {item.location}</p>}
                <p className="text-xs font-cute text-gray-500 mt-0.5">
                  Has: {item.qty} {item.unit || 'pcs'} · Restock at: {item.restockQty}
                </p>
              </div>

              {item.fullQty > 0 ? (
                <button
                  onClick={() => onUpdateQty(item.id, item.fullQty)}
                  className="flex-shrink-0 px-3 py-2 rounded-xl bg-mint-50 border-2 border-mint-300 text-mint-500 text-xs font-cute font-bold hover:bg-mint-100 active:scale-95 transition-all text-center leading-tight"
                >
                  ↺ Full<br /><span className="text-gray-400">({item.fullQty})</span>
                </button>
              ) : (
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <button
                    onClick={() => onUpdateQty(item.id, item.qty + 1)}
                    className="w-10 h-10 rounded-full bg-mint-100 text-mint-500 font-bold text-lg flex items-center justify-center hover:bg-mint-200 active:scale-95 transition-all"
                  >+</button>
                  <span className="text-xs font-cute text-gray-500">{item.qty}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
