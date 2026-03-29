import React, { useState } from 'react'

const PRIORITIES = [
  { key: 'high',   label: 'High',   color: 'bg-red-100 dark:bg-red-500/20 text-red-500',    dot: 'bg-red-400' },
  { key: 'medium', label: 'Medium', color: 'bg-peach-100 dark:bg-peach-500/20 text-peach-500', dot: 'bg-peach-400' },
  { key: 'low',    label: 'Low',    color: 'bg-mint-100 dark:bg-mint-500/20 text-mint-600',  dot: 'bg-mint-400' },
]

export default function WishlistPage({ items, categories, loading, onAdd, onDelete, onUpdatePriority, onPromote }) {
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(null) // item id being promoted
  const [form,   setForm]   = useState({ name: '', notes: '', categoryId: '', priority: 'medium', estimatedPrice: '', store: '', link: '' })

  function set(key, val) { setForm(prev => ({ ...prev, [key]: val })) }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    await onAdd({
      name:           form.name.trim(),
      notes:          form.notes,
      categoryId:     form.categoryId || null,
      priority:       form.priority,
      estimatedPrice: form.estimatedPrice ? Number(form.estimatedPrice) : null,
      store:          form.store,
      link:           form.link,
    })
    setForm({ name: '', notes: '', categoryId: '', priority: 'medium', estimatedPrice: '', store: '', link: '' })
    setAdding(false)
  }

  async function handlePromote(item) {
    setSaving(item.id)
    await onPromote({
      name:       item.name,
      notes:      item.notes,
      categoryId: item.categoryId,
      price:      item.estimatedPrice,
      store:      item.store,
      qty:        0,
      restockQty: 1,
      fullQty:    0,
      unit:       'pcs',
      locationId: null,
    })
    await onDelete(item.id)
    setSaving(null)
  }

  const byPriority = ['high', 'medium', 'low'].map(p => ({
    priority: p,
    meta: PRIORITIES.find(x => x.key === p),
    items: items.filter(i => i.priority === p),
  })).filter(g => g.items.length > 0)

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 pb-10 animate-fade-in">

      {/* Add button */}
      {!adding && (
        <div className="pt-4 mb-4">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-lavender-400 to-blush-300 shadow hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
          >
            ⭐ Add to Wishlist
          </button>
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="mb-5 bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 border-2 border-dashed border-lavender-200 dark:border-lavender-500/30 animate-fade-in">
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-3">New Wishlist Item</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="text" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="What do you want to get? e.g. Fancy diffuser, Vitamin C serum…"
              autoFocus required
              className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-500/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-blush-300 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white transition-colors"
            />

            {/* Priority */}
            <div>
              <label className="block font-sans font-bold text-xs text-gray-500 dark:text-gray-400 mb-1.5">Priority</label>
              <div className="flex gap-2">
                {PRIORITIES.map(p => (
                  <button
                    key={p.key} type="button" onClick={() => set('priority', p.key)}
                    className={`flex-1 py-1.5 rounded-xl font-sans font-bold text-xs transition-all border-2 ${
                      form.priority === p.key
                        ? `${p.color} border-transparent`
                        : 'border-gray-100 dark:border-gray-700 text-gray-400'
                    }`}
                  >
                    <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${form.priority === p.key ? p.dot : 'bg-gray-300'}`} />
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.filter(c => c.id !== 'all').length > 0 && (
              <div>
                <label className="block font-sans font-bold text-xs text-gray-500 dark:text-gray-400 mb-1.5">Category <span className="font-normal">(optional)</span></label>
                <select
                  value={form.categoryId} onChange={e => set('categoryId', e.target.value)}
                  className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-500/30 px-4 py-2 font-sans text-sm bg-white dark:bg-gray-700 dark:text-white focus:outline-none"
                >
                  <option value="">No category</option>
                  {categories.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-sans font-bold text-xs text-gray-500 dark:text-gray-400 mb-1">Est. Price 💰</label>
                <input
                  type="number" min="0" step="0.01" value={form.estimatedPrice}
                  onChange={e => set('estimatedPrice', e.target.value)}
                  placeholder="$0.00"
                  className="w-full rounded-2xl border-2 border-mint-200 dark:border-mint-400/30 px-3 py-2 font-sans text-sm bg-mint-50/50 dark:bg-mint-500/10 dark:text-white focus:outline-none focus:border-mint-300 transition-colors"
                />
              </div>
              <div>
                <label className="block font-sans font-bold text-xs text-gray-500 dark:text-gray-400 mb-1">Store 🏪</label>
                <input
                  type="text" value={form.store} onChange={e => set('store', e.target.value)}
                  placeholder="Costco, Amazon…"
                  className="w-full rounded-2xl border-2 border-sky-200 dark:border-sky-400/30 px-3 py-2 font-sans text-sm bg-sky-50/50 dark:bg-sky-500/10 dark:text-white focus:outline-none focus:border-sky-300 transition-colors"
                />
              </div>
            </div>

            <input
              type="text" value={form.notes} onChange={e => set('notes', e.target.value)}
              placeholder="Notes (brand, size, why you want it…)"
              className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-500/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-lavender-300 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white transition-colors"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button" onClick={() => setAdding(false)}
                className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all"
              >Cancel</button>
              <button
                type="submit" disabled={!form.name.trim()}
                className="flex-1 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-lavender-400 to-blush-300 shadow hover:shadow-md transition-all disabled:opacity-50"
              >Add to Wishlist ⭐</button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !adding && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <p className="font-sans font-semibold text-gray-500 dark:text-gray-400 mb-1">Wishlist is empty</p>
          <p className="font-sans text-sm text-gray-400 dark:text-gray-500">
            Add things you want to try or buy — then promote them to inventory when you get them.
          </p>
          <button
            onClick={() => setAdding(true)}
            className="mt-5 px-6 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-lavender-400 to-blush-300 shadow"
          >Add First Item</button>
        </div>
      )}

      {/* Priority groups */}
      {byPriority.map(({ priority, meta, items: groupItems }) => (
        <div key={priority} className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${meta.dot}`} />
            <h3 className="font-sans font-bold text-sm text-gray-600 dark:text-gray-300">{meta.label} Priority</h3>
            <span className="font-sans text-xs text-gray-400">{groupItems.length}</span>
          </div>

          <div className="space-y-2">
            {groupItems.map(item => {
              const cat = categories.find(c => c.id === item.categoryId)
              const isPromoting = saving === item.id
              return (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-3 flex items-start gap-3 animate-fade-in">
                  {/* Priority dot */}
                  <div className="flex-shrink-0 mt-1">
                    <select
                      value={item.priority}
                      onChange={e => onUpdatePriority(item.id, e.target.value)}
                      className="appearance-none w-5 h-5 rounded-full cursor-pointer focus:outline-none"
                      style={{ background: meta.dot.replace('bg-', '').includes('red') ? '#f87171' : meta.dot.replace('bg-', '').includes('peach') ? '#fb923c' : '#4ade80' }}
                      aria-label="Change priority"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200">{item.name}</p>
                    {item.notes && (
                      <p className="font-sans text-xs text-gray-400 mt-0.5 leading-relaxed">{item.notes}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {cat && <span className="text-xs font-sans" style={{ color: cat.color }}>{cat.emoji} {cat.name}</span>}
                      {item.store && <span className="text-xs font-sans text-sky-400">🏪 {item.store}</span>}
                      {item.estimatedPrice != null && (
                        <span className="text-xs font-sans text-mint-500 font-semibold">${Number(item.estimatedPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex flex-col gap-1.5">
                    <button
                      onClick={() => handlePromote(item)}
                      disabled={isPromoting}
                      title="Got it! Add to inventory"
                      className="px-3 py-1.5 rounded-xl font-sans font-bold text-xs text-white bg-gradient-to-r from-mint-400 to-lavender-400 shadow hover:shadow-md active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isPromoting ? '…' : '✓ Got it'}
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      title="Remove from wishlist"
                      className="px-3 py-1.5 rounded-xl font-sans font-bold text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-red-50 hover:text-red-400 active:scale-95 transition-all"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
