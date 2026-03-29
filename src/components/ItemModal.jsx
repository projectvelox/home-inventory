import React, { useState, useRef, useEffect } from 'react'

export default function ItemModal({ item, categories, onSave, onDelete, onClose }) {
  const isEdit = !!item?.id
  const fileRef = useRef()
  const aiScanRef = useRef()

  const [form, setForm] = useState({
    name: item?.name ?? '',
    categoryId: item?.categoryId ?? (categories[1]?.id ?? 'groceries'),
    qty: item?.qty ?? 1,
    restockQty: item?.restockQty ?? 2,
    fullQty: item?.fullQty ?? 0,
    unit: item?.unit ?? 'pcs',
    notes: item?.notes ?? '',
    location: item?.location ?? '',
    image: item?.image ?? null,
  })
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState(null)

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  function handleImage(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => set('image', ev.target.result)
    reader.readAsDataURL(file)
  }

  function handleAIScan(e) {
    const file = e.target.files[0]
    if (!file) return
    setScanError(null)
    setScanning(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = ev.target.result
      set('image', base64)
      try {
        const categoryName = categories.find(c => c.id === form.categoryId)?.name
        const res = await fetch('/api/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64, categoryName }),
        })
        if (!res.ok) throw new Error('Scan failed')
        const data = await res.json()
        if (data.name) set('name', data.name)
        if (data.unit) set('unit', data.unit)
        if (data.notes) set('notes', data.notes)
      } catch {
        setScanError('Could not read item — try again or fill in manually.')
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({ ...item, ...form, qty: Number(form.qty), restockQty: Number(form.restockQty), fullQty: Number(form.fullQty) })
  }

  // Close on backdrop click
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const catColor = categories.find(c => c.id === form.categoryId)?.color ?? '#f9a8d4'

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200"></div>
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title text-2xl text-blush-400">
              {isEdit ? 'Edit Item ✏️' : 'Add Item ✨'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image */}
            <div className="flex flex-col items-center gap-2">
              {/* Photo preview */}
              <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-blush-200 bg-blush-50 overflow-hidden flex items-center justify-center">
                {scanning ? (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 border-4 border-lavender-300 border-t-lavender-500 rounded-full animate-spin" />
                    <span className="text-xs font-cute text-lavender-400 font-semibold">Reading...</span>
                  </div>
                ) : form.image ? (
                  <img src={form.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">📦</span>
                )}
              </div>

              {/* Buttons row */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { aiScanRef.current.value = ''; aiScanRef.current?.click() }}
                  disabled={scanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-cute font-bold text-sm text-white bg-gradient-to-r from-lavender-400 to-blush-400 shadow hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                >
                  <span>✨</span>
                  <span>{scanning ? 'Scanning...' : 'AI Scan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { fileRef.current.value = ''; fileRef.current?.click() }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-cute font-bold text-sm text-blush-400 bg-blush-50 border-2 border-blush-200 hover:bg-blush-100 transition-all"
                >
                  <span>📷</span>
                  <span>Photo</span>
                </button>
              </div>

              {/* Hidden inputs */}
              <input ref={aiScanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAIScan} aria-label="AI scan image" />
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage} aria-label="Upload photo" />

              {scanError && (
                <p className="text-xs font-cute text-peach-400 text-center">{scanError}</p>
              )}
              {form.image && !scanning && (
                <button type="button" onClick={() => set('image', null)} className="text-xs font-cute text-gray-400 hover:text-red-400 transition-colors">
                  Remove photo
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Item Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Baby wipes, Milk, Shampoo..."
                required
                className="w-full rounded-2xl border-2 border-lavender-200 px-4 py-2.5 font-cute text-sm focus:outline-none focus:border-blush-300 transition-colors bg-lavender-50/50"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Category</label>
              <div className="flex flex-wrap gap-2">
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => set('categoryId', cat.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-cute font-bold transition-all ${
                      form.categoryId === cat.id ? 'text-white shadow-sm scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={form.categoryId === cat.id ? { backgroundColor: cat.color } : {}}
                  >
                    {cat.emoji} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Qty row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Qty</label>
                <input
                  type="number"
                  min="0"
                  value={form.qty}
                  onChange={e => set('qty', e.target.value)}
                  className="w-full rounded-2xl border-2 border-mint-200 px-3 py-2.5 font-cute font-bold text-sm text-center focus:outline-none focus:border-mint-300 bg-mint-50/50 transition-colors"
                />
              </div>
              <div>
                <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Restock at</label>
                <input
                  type="number"
                  min="0"
                  value={form.restockQty}
                  onChange={e => set('restockQty', e.target.value)}
                  className="w-full rounded-2xl border-2 border-peach-200 px-3 py-2.5 font-cute font-bold text-sm text-center focus:outline-none focus:border-peach-300 bg-peach-50/50 transition-colors"
                />
              </div>
              <div>
                <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Unit</label>
                <input
                  type="text"
                  value={form.unit}
                  onChange={e => set('unit', e.target.value)}
                  placeholder="pcs"
                  className="w-full rounded-2xl border-2 border-sky-200 px-3 py-2.5 font-cute text-sm text-center focus:outline-none focus:border-sky-300 bg-sky-50/50 transition-colors"
                />
              </div>
            </div>

            {/* Full level */}
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Full level 🔝 <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                type="number"
                min="0"
                value={form.fullQty}
                onChange={e => set('fullQty', e.target.value)}
                placeholder="e.g. 6"
                className="w-full rounded-2xl border-2 border-mint-200 px-4 py-2.5 font-cute text-sm focus:outline-none focus:border-mint-300 bg-mint-50/50 transition-colors"
              />
              <p className="font-cute text-xs text-gray-400 mt-1">Shows a "Set to full" button on the card when stock is low</p>
            </div>

            {/* Location */}
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Where stored? 📍 <span className="font-normal text-gray-400">(optional)</span></label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="e.g. Kitchen cabinet, Under sink..."
                className="w-full rounded-2xl border-2 border-lavender-200 px-4 py-2.5 font-cute text-sm focus:outline-none focus:border-lavender-400 bg-lavender-50/50 transition-colors"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Notes 📝</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                placeholder="Any notes about this item..."
                rows={2}
                className="w-full rounded-2xl border-2 border-lavender-200 px-4 py-2.5 font-cute text-sm focus:outline-none focus:border-lavender-300 bg-lavender-50/50 resize-none transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              {isEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  className="flex-shrink-0 w-11 h-11 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 transition-all text-lg"
                >
                  🗑️
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-3 rounded-2xl font-cute font-bold text-white text-base shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${catColor}, #f472b6)` }}
              >
                {isEdit ? 'Save Changes ✨' : 'Add to Inventory 🎉'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
