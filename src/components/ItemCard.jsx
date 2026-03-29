import React, { useState, useRef, memo, useCallback } from 'react'

function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso)
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)   return `${days}d ago`
  if (days < 30)  return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

const ItemCard = memo(function ItemCard({ item, category, location, onEdit, onDelete, onUpdateQty, onDuplicate, canEdit }) {
  const isLow   = item.qty <= item.restockQty && item.restockQty > 0
  const isEmpty = item.qty === 0

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const expiry        = item.expiryDate ? new Date(item.expiryDate + 'T00:00:00') : null
  const isExpired     = expiry && expiry < today
  const daysToExpiry  = expiry ? Math.ceil((expiry - today) / 86400000) : null
  const isExpiringSoon = expiry && !isExpired && daysToExpiry <= 7

  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput,   setQtyInput]   = useState('')
  const [menuOpen,   setMenuOpen]   = useState(false)
  const inputRef  = useRef()
  const longPress = useRef(null)
  const menuRef   = useRef()

  function startEditQty() {
    setQtyInput(String(item.qty))
    setEditingQty(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 30)
  }

  function commitQty() {
    const val = parseInt(qtyInput, 10)
    if (!isNaN(val) && val >= 0) onUpdateQty(item.id, val)
    setEditingQty(false)
  }

  function handleQtyKey(e) {
    if (e.key === 'Enter')  commitQty()
    if (e.key === 'Escape') setEditingQty(false)
  }

  const handleTouchStart = useCallback(() => {
    longPress.current = setTimeout(() => setMenuOpen(true), 500)
  }, [])
  const handleTouchEnd = useCallback(() => clearTimeout(longPress.current), [])
  const handleContextMenu = useCallback((e) => { e.preventDefault(); setMenuOpen(true) }, [])
  const handleMenuBlur = useCallback((e) => {
    if (!menuRef.current?.contains(e.relatedTarget)) setMenuOpen(false)
  }, [])

  // Accent color: category color → fallback based on status
  const accentColor = category?.color ?? (isEmpty ? '#ef4444' : isLow ? '#fb923c' : '#c4b5fd')

  const statusBg = isExpired ? 'bg-red-500'
    : isEmpty    ? 'bg-red-400'
    : isLow      ? 'bg-peach-400'
    : null

  const statusLabel = isExpired ? 'Expired'
    : isEmpty    ? 'Empty'
    : isLow      ? 'Low'
    : null

  const expiryLabel = isExpired ? 'Expired'
    : isExpiringSoon ? (daysToExpiry === 0 ? 'Today' : `${daysToExpiry}d`)
    : null

  return (
    <div
      className="group relative bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden transition-all duration-200 hover:shadow-card-md hover:-translate-y-0.5 animate-fade-in select-none"
      onContextMenu={handleContextMenu}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
    >
      {/* Category accent bar — top */}
      <div className="h-1 w-full" style={{ background: accentColor }} />

      {/* Context menu overlay */}
      {menuOpen && (
        <div
          ref={menuRef}
          tabIndex={-1}
          onBlur={handleMenuBlur}
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm rounded-2xl animate-fade-in"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-modal p-2 flex flex-col gap-1 w-44"
            onClick={e => e.stopPropagation()}
          >
            {canEdit && (
              <button onClick={() => { setMenuOpen(false); onEdit(item) }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-blush-50 dark:hover:bg-blush-500/10 transition-all text-left">
                ✏️ Edit
              </button>
            )}
            <button onClick={() => { setMenuOpen(false); onUpdateQty(item.id, item.qty + 1) }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-mint-50 dark:hover:bg-mint-500/10 transition-all text-left">
              +1 Add one
            </button>
            <button onClick={() => { setMenuOpen(false); onUpdateQty(item.id, Math.max(0, item.qty - 1)) }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-peach-50 dark:hover:bg-peach-500/10 transition-all text-left">
              −1 Use one
            </button>
            {item.fullQty > 0 && (
              <button onClick={() => { setMenuOpen(false); onUpdateQty(item.id, item.fullQty) }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-mint-50 dark:hover:bg-mint-500/10 transition-all text-left">
                ↺ Set to full
              </button>
            )}
            {canEdit && onDuplicate && (
              <button onClick={() => { setMenuOpen(false); onDuplicate(item.id) }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 hover:bg-lavender-50 dark:hover:bg-lavender-500/10 transition-all text-left">
                📋 Duplicate
              </button>
            )}
            {canEdit && (
              <button onClick={() => { setMenuOpen(false); onDelete(item.id) }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left">
                🗑️ Delete
              </button>
            )}
            <button onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl font-sans font-semibold text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-left mt-0.5 border-t border-gray-100 dark:border-gray-700">
              ✕ Close
            </button>
          </div>
        </div>
      )}

      {/* Main card body */}
      <div className="p-3">
        {/* Top row: emoji + name + edit btn */}
        <div className="flex items-start gap-2.5">
          {/* Item image or category emoji */}
          <div className="w-11 h-11 rounded-xl flex-shrink-0 overflow-hidden"
            style={{ background: `${accentColor}18` }}>
            {item.image ? (
              <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">
                {category?.emoji ?? '📦'}
              </div>
            )}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h3 className="font-sans font-bold text-gray-800 dark:text-gray-100 text-sm leading-snug truncate">
              {item.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              {category && category.id !== 'all' && (
                <span className="text-[10px] font-sans font-semibold" style={{ color: accentColor }}>
                  {category.emoji} {category.name}
                </span>
              )}
              {(location || item.location) && (
                <span className="text-[10px] font-sans text-gray-400 truncate max-w-[100px]">
                  📍 {location?.name ?? item.location}
                </span>
              )}
            </div>
          </div>

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={() => onEdit(item)}
              className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs text-gray-400 hover:bg-blush-100 hover:text-blush-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
            >✏️</button>
          )}
        </div>

        {/* Status badges row */}
        {(statusLabel || expiryLabel || item.store) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {statusLabel && (
              <span className={`${statusBg} text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full`}>
                {statusLabel}
              </span>
            )}
            {expiryLabel && (
              <span className={`${isExpired ? 'bg-red-500' : 'bg-amber-400'} text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full`}>
                📅 {expiryLabel}
              </span>
            )}
            {item.store && !statusLabel && !expiryLabel && (
              <span className="text-[10px] font-sans text-gray-400 truncate">🏪 {item.store}</span>
            )}
          </div>
        )}

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50 dark:border-gray-700/60">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onUpdateQty(item.id, Math.max(0, item.qty - 1))}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-base flex items-center justify-center hover:bg-peach-100 hover:text-peach-500 active:scale-90 transition-all"
            >−</button>

            {editingQty ? (
              <input
                ref={inputRef}
                type="number" min="0"
                value={qtyInput}
                onChange={e => setQtyInput(e.target.value)}
                onBlur={commitQty}
                onKeyDown={handleQtyKey}
                className="w-10 text-center font-sans font-bold text-base border-2 border-blush-200 rounded-lg focus:outline-none focus:border-blush-400 bg-blush-50 dark:bg-blush-900/20 py-0.5 text-gray-800 dark:text-white"
              />
            ) : (
              <button
                onClick={startEditQty}
                title="Tap to set quantity"
                className={`font-sans font-bold text-base w-10 text-center rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 py-0.5 transition-all ${
                  isEmpty ? 'text-red-500' : isLow ? 'text-peach-500' : 'text-gray-800 dark:text-gray-100'
                }`}
              >{item.qty}</button>
            )}

            <button
              onClick={() => onUpdateQty(item.id, item.qty + 1)}
              className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold text-base flex items-center justify-center hover:bg-mint-100 hover:text-mint-600 active:scale-90 transition-all"
            >+</button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-gray-400">{item.unit || 'pcs'}</span>
            {item.price != null && (
              <span className="text-[10px] font-sans font-semibold text-gray-300 dark:text-gray-500">
                ${Number(item.price).toFixed(2)}
              </span>
            )}
            {item.fullQty > 0 && isLow && (
              <button
                onClick={() => onUpdateQty(item.id, item.fullQty)}
                className="text-[10px] font-sans font-bold text-mint-500 bg-mint-50 dark:bg-mint-500/10 border border-mint-200 dark:border-mint-500/30 px-2 py-0.5 rounded-full hover:bg-mint-100 active:scale-95 transition-all"
              >↺ Full</button>
            )}
          </div>
        </div>

        {/* Audit trail */}
        {item.updatedBy && (
          <p className="text-[10px] font-sans text-gray-300 dark:text-gray-600 mt-1.5 truncate">
            ✏️ {item.updatedBy} · {timeAgo(item.updatedAt)}
          </p>
        )}
      </div>
    </div>
  )
})

export default ItemCard
