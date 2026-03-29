import React, { useState, useRef } from 'react'

function formatRestocked(iso) {
  if (!iso) return null
  const diffDays = Math.floor((Date.now() - new Date(iso)) / 86400000)
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export default function ItemCard({ item, category, onEdit, onUpdateQty, canEdit }) {
  const isLow = item.qty <= item.restockQty && item.restockQty > 0
  const isEmpty = item.qty === 0
  const [editingQty, setEditingQty] = useState(false)
  const [qtyInput, setQtyInput] = useState('')
  const inputRef = useRef()

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
    if (e.key === 'Enter') commitQty()
    if (e.key === 'Escape') setEditingQty(false)
  }

  return (
    <div className={`relative bg-white rounded-3xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-fade-in ${
      isLow ? 'ring-2 ring-peach-300' : ''
    }`}>
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-blush-50 to-lavender-50 overflow-hidden">
        {item.image ? (
          <img src={item.image} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">{category?.emoji ?? '📦'}</span>
          </div>
        )}
        {isLow && (
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-cute font-bold text-white shadow ${isEmpty ? 'bg-red-400' : 'bg-peach-400'}`}>
            {isEmpty ? '😱 Empty!' : '⚠️ Low!'}
          </div>
        )}
        {canEdit && (
          <button
            onClick={() => onEdit(item)}
            className="absolute top-2 right-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center text-sm hover:bg-white shadow transition-all"
          >
            ✏️
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-cute font-bold text-gray-700 text-sm leading-tight truncate">{item.name}</h3>
        {category && category.id !== 'all' && (
          <span className="inline-flex items-center gap-1 text-xs font-cute font-semibold mt-0.5" style={{ color: category.color }}>
            {category.emoji} {category.name}
          </span>
        )}
        {item.location && (
          <p className="text-xs font-cute text-gray-400 mt-0.5 truncate">📍 {item.location}</p>
        )}

        {/* Qty controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateQty(item.id, Math.max(0, item.qty - 1))}
              className="w-10 h-10 rounded-full bg-blush-100 text-blush-400 font-bold text-lg flex items-center justify-center hover:bg-blush-200 active:scale-95 transition-all"
            >−</button>
            {editingQty ? (
              <input
                ref={inputRef}
                type="number"
                min="0"
                value={qtyInput}
                onChange={e => setQtyInput(e.target.value)}
                onBlur={commitQty}
                onKeyDown={handleQtyKey}
                className="w-10 text-center font-cute font-extrabold text-lg border-2 border-lavender-300 rounded-xl focus:outline-none focus:border-blush-300 bg-lavender-50 py-1"
              />
            ) : (
              <button
                onClick={startEditQty}
                title="Tap to set quantity"
                className={`font-cute font-extrabold text-lg w-10 text-center rounded-xl hover:bg-lavender-50 transition-all py-1 ${isEmpty ? 'text-red-400' : isLow ? 'text-peach-400' : 'text-gray-700'}`}
              >
                {item.qty}
              </button>
            )}
            <button
              onClick={() => onUpdateQty(item.id, item.qty + 1)}
              className="w-10 h-10 rounded-full bg-mint-100 text-mint-400 font-bold text-lg flex items-center justify-center hover:bg-mint-200 active:scale-95 transition-all"
            >+</button>
          </div>
          <span className="text-xs font-cute text-gray-400">{item.unit || 'pcs'}</span>
        </div>

        {/* Set to full */}
        {isLow && item.fullQty > 0 && (
          <button
            onClick={() => onUpdateQty(item.id, item.fullQty)}
            className="mt-2 w-full py-1.5 rounded-xl bg-mint-50 border border-mint-200 text-mint-500 text-xs font-cute font-bold hover:bg-mint-100 active:scale-95 transition-all"
          >
            ↺ Set to full ({item.fullQty})
          </button>
        )}

        {item.restockQty > 0 && (
          <p className="text-xs font-cute text-gray-400 mt-1">Restock at: {item.restockQty}</p>
        )}
        {item.lastRestocked && (
          <p className="text-xs font-cute text-lavender-400 mt-0.5">♻️ Restocked {formatRestocked(item.lastRestocked)}</p>
        )}
        {item.notes && (
          <p className="text-xs font-cute text-lavender-400 mt-1 italic truncate">📝 {item.notes}</p>
        )}
      </div>
    </div>
  )
}
