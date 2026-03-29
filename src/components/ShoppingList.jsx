import React, { useState, useMemo } from 'react'

export default function ShoppingList({ items, categories, locations = [], onUpdateQty }) {
  const [shoppingMode, setShoppingMode] = useState(false)
  const [checked,      setChecked]      = useState(new Set())
  const [groupByStore, setGroupByStore] = useState(false)
  // Per-item qty overrides while shopping (id → qty string)
  const [buyQtys,      setBuyQtys]      = useState({})

  function toggleCheck(id) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  async function doneShopping() {
    for (const id of checked) {
      const item = items.find(i => i.id === id)
      if (!item) continue
      // Use custom entered qty if provided, else default
      const override = buyQtys[id] !== undefined ? parseInt(buyQtys[id], 10) : NaN
      const newQty = !isNaN(override) && override >= 0
        ? override
        : item.fullQty > 0 ? item.fullQty : item.restockQty + 1
      onUpdateQty(id, newQty)
    }
    setChecked(new Set())
    setBuyQtys({})
    setShoppingMode(false)
  }

  function getLocationName(item) {
    if (item.locationId) return locations.find(l => l.id === item.locationId)?.name ?? item.location
    return item.location
  }

  // Running total (items that have a price)
  const total = useMemo(() =>
    items.reduce((sum, i) => i.price != null ? sum + Number(i.price) : sum, 0),
    [items]
  )
  const hasAnyPrice = items.some(i => i.price != null)

  // Group by category
  const groupedByCategory = useMemo(() => {
    const grouped = categories
      .filter(c => c.id !== 'all')
      .map(cat => ({ key: cat.id, label: cat.name, emoji: cat.emoji, color: cat.color, items: items.filter(i => i.categoryId === cat.id) }))
      .filter(g => g.items.length > 0)
    const knownCatIds = new Set(categories.map(c => c.id))
    const orphans = items.filter(i => !knownCatIds.has(i.categoryId))
    if (orphans.length > 0) grouped.push({ key: '_other', label: 'Other', emoji: '📦', color: '#94a3b8', items: orphans })
    return grouped
  }, [items, categories])

  // Group by store
  const groupedByStore = useMemo(() => {
    const storeMap = new Map()
    for (const item of items) {
      const key = item.store?.trim() || '(no store set)'
      if (!storeMap.has(key)) storeMap.set(key, [])
      storeMap.get(key).push(item)
    }
    return Array.from(storeMap.entries())
      .map(([label, storeItems]) => ({ key: label, label, emoji: label === '(no store set)' ? '🛒' : '🏪', color: '#a78bfa', items: storeItems }))
      .sort((a, b) => a.label === '(no store set)' ? 1 : a.label.localeCompare(b.label))
  }, [items])

  const hasStores = items.some(i => i.store?.trim())
  const grouped = groupByStore ? groupedByStore : groupedByCategory

  function share() {
    const lines = []
    grouped.forEach(({ emoji, label, items: gi }) => {
      lines.push(`${emoji} ${label}`)
      gi.forEach(item => {
        const status = item.qty === 0 ? '(empty!)' : `(${item.qty} left)`
        lines.push(`  • ${item.name} ${status}`)
      })
      lines.push('')
    })
    const text = `🛒 Shopping List — ${new Date().toLocaleDateString()}\n\n${lines.join('\n').trim()}`
    if (navigator.share) {
      navigator.share({ text }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard! 📋'))
    }
  }

  function exportCSV() {
    const headers = ['Item', 'Category', 'Store', 'Have', 'Unit', 'Restock at', 'Price', 'Status', 'Location']
    const rows = items.map(item => {
      const cat = categories.find(c => c.id === item.categoryId)
      return [item.name, cat?.name ?? '', item.store ?? '', item.qty, item.unit || 'pcs',
        item.restockQty, item.price != null ? Number(item.price).toFixed(2) : '',
        item.qty === 0 ? 'Empty' : 'Low', getLocationName(item) ?? '']
    })
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `to-buy-${new Date().toISOString().split('T')[0]}.csv`,
    }).click()
    URL.revokeObjectURL(url)
  }

  function copyChecklist() {
    const lines = [`🛒 Shopping List — ${new Date().toLocaleDateString()}\n`]
    grouped.forEach(({ emoji, label, items: gi }) => {
      lines.push(`${emoji} ${label}`)
      gi.forEach(item => {
        const qty = item.qty === 0 ? 'empty!' : `${item.qty} ${item.unit || 'pcs'} left`
        lines.push(`☐ ${item.name} (${qty})`)
      })
      lines.push('')
    })
    navigator.clipboard.writeText(lines.join('\n').trim())
      .then(() => alert('Checklist copied! Paste into Microsoft To Do, Apple Reminders, or any notes app 📋'))
      .catch(() => alert('Could not copy — try the Share button'))
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="font-title text-2xl text-mint-400 mb-2">All stocked up!</h2>
        <p className="font-sans text-gray-400 text-sm dark:text-gray-500">No items need restocking right now.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 animate-fade-in">

      {/* Header row */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans text-sm text-gray-400 dark:text-gray-500 font-semibold">
            {items.length} {items.length === 1 ? 'item' : 'items'} to buy
          </p>
          {hasAnyPrice && (
            <span className="font-sans text-sm font-bold text-mint-600 dark:text-mint-400">
              ≈ ${total.toFixed(2)}
            </span>
          )}
          <button
            onClick={() => { setShoppingMode(v => !v); setChecked(new Set()) }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-sans font-bold text-xs transition-all ${
              shoppingMode
                ? 'bg-mint-400 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
            }`}
          >
            {shoppingMode ? '🛒 Shopping' : '🛒 Shop mode'}
          </button>
          {hasStores && (
            <button
              onClick={() => setGroupByStore(v => !v)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-sans font-bold text-xs transition-all ${
                groupByStore
                  ? 'bg-sky-400 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              🏪 {groupByStore ? 'By Store' : 'By Store'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportCSV}      className="flex items-center gap-1 px-3 py-2 rounded-xl font-sans font-bold text-xs text-mint-500 bg-mint-50 dark:bg-mint-500/10 border border-mint-200 dark:border-mint-500/20 hover:bg-mint-100 active:scale-95 transition-all" title="Download as Excel/CSV">
            📊 Excel
          </button>
          <button onClick={copyChecklist}  className="flex items-center gap-1 px-3 py-2 rounded-xl font-sans font-bold text-xs text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 border border-lavender-200 dark:border-lavender-500/20 hover:bg-lavender-100 active:scale-95 transition-all" title="Copy for To Do apps">
            ☐ To-Do
          </button>
          <button onClick={share}          className="flex items-center gap-1 px-3 py-2 rounded-xl font-sans font-bold text-xs text-white bg-gradient-to-r from-mint-400 to-lavender-400 shadow hover:shadow-md active:scale-95 transition-all">
            📤 Share
          </button>
        </div>
      </div>

      {/* Done shopping bar */}
      {shoppingMode && checked.size > 0 && (
        <div className="mb-4 bg-mint-50 dark:bg-mint-500/10 border border-mint-200 dark:border-mint-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <p className="font-sans font-semibold text-sm text-mint-600 dark:text-mint-400">
              {checked.size} item{checked.size !== 1 ? 's' : ''} in cart
            </p>
            <button
              onClick={() => { setChecked(new Set()); setBuyQtys({}) }}
              className="font-sans text-xs text-mint-500 underline hover:text-mint-700 transition-colors"
            >
              Uncheck all
            </button>
          </div>
          <button
            onClick={doneShopping}
            className="px-4 py-2 rounded-xl font-sans font-bold text-sm text-white bg-mint-400 hover:bg-mint-500 active:scale-95 transition-all shadow-sm"
          >
            ✓ Done Shopping
          </button>
        </div>
      )}

      {/* Grouped items */}
      <div className="space-y-5 pb-6">
        {grouped.map(({ key, label, emoji, color, items: groupItems }) => (
          <div key={key}>
            <div className="flex items-center gap-2 mb-2">
              <div
                className="flex items-center gap-1.5 px-3 py-1 rounded-full font-sans font-bold text-sm text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </div>
              <span className="font-sans text-xs text-gray-400 dark:text-gray-500">{groupItems.length} item{groupItems.length !== 1 ? 's' : ''}</span>
              {hasAnyPrice && (
                <span className="font-sans text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {groupItems.filter(i => i.price != null).length > 0 && (
                    `≈ $${groupItems.reduce((s, i) => i.price != null ? s + Number(i.price) : s, 0).toFixed(2)}`
                  )}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {groupItems.map(item => {
                const cat = categories.find(c => c.id === item.categoryId)
                const isEmpty = item.qty === 0
                const isChecked = checked.has(item.id)
                return (
                  <div
                    key={item.id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 flex items-center gap-3 transition-all ${
                      isChecked
                        ? 'opacity-50 ring-2 ring-mint-300'
                        : isEmpty ? 'ring-2 ring-red-200' : 'ring-2 ring-peach-200'
                    }`}
                  >
                    {/* Shopping mode checkbox */}
                    {shoppingMode && (
                      <button
                        onClick={() => toggleCheck(item.id)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-mint-400 border-mint-400 text-white'
                            : 'border-gray-300 dark:border-gray-500'
                        }`}
                      >
                        {isChecked && <span className="text-xs font-bold">✓</span>}
                      </button>
                    )}

                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blush-50 to-lavender-50 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" />
                        : <span className="text-2xl">{cat?.emoji ?? '📦'}</span>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className={`font-sans font-bold text-gray-700 dark:text-gray-200 text-sm truncate ${isChecked ? 'line-through' : ''}`}>{item.name}</h3>
                        <span className={`text-xs font-sans font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0 ${isEmpty ? 'bg-red-400' : 'bg-peach-400'}`}>
                          {isEmpty ? 'Empty!' : 'Low!'}
                        </span>
                      </div>
                      {getLocationName(item) && (
                        <p className="text-xs font-sans text-gray-400 mt-0.5">📍 {getLocationName(item)}</p>
                      )}
                      <p className="text-xs font-sans text-gray-500 dark:text-gray-400 mt-0.5">
                        Has: {item.qty} {item.unit || 'pcs'} · Restock at: {item.restockQty}
                        {item.price != null && ` · $${Number(item.price).toFixed(2)}`}
                      </p>
                      {/* Per-item qty input when checked in shopping mode */}
                      {shoppingMode && isChecked && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-[11px] font-sans text-gray-400">Bought:</span>
                          <input
                            type="number"
                            min="0"
                            value={buyQtys[item.id] ?? (item.fullQty > 0 ? item.fullQty : item.restockQty + 1)}
                            onChange={e => setBuyQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onClick={e => e.stopPropagation()}
                            className="w-14 text-center font-sans font-bold text-xs border-2 border-mint-200 dark:border-mint-500/40 rounded-lg py-0.5 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:border-mint-400"
                          />
                          <span className="text-[11px] font-sans text-gray-400">{item.unit || 'pcs'}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    {!shoppingMode && (
                      item.fullQty > 0 ? (
                        <button
                          onClick={() => onUpdateQty(item.id, item.fullQty)}
                          className="flex-shrink-0 px-3 py-2 rounded-xl bg-mint-50 dark:bg-mint-500/10 border-2 border-mint-300 dark:border-mint-500/30 text-mint-500 text-xs font-sans font-bold hover:bg-mint-100 active:scale-95 transition-all text-center leading-tight"
                        >
                          ↺ Full<br /><span className="text-gray-400">({item.fullQty})</span>
                        </button>
                      ) : (
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                          <button
                            onClick={() => onUpdateQty(item.id, item.qty + 1)}
                            className="w-10 h-10 rounded-full bg-mint-100 dark:bg-mint-500/20 text-mint-500 font-bold text-lg flex items-center justify-center hover:bg-mint-200 active:scale-95 transition-all"
                          >+</button>
                          <span className="text-xs font-sans text-gray-500 dark:text-gray-400">{item.qty}</span>
                        </div>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
