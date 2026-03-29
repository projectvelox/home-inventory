import React, { useState, useRef } from 'react'
import BarcodeScanner from './BarcodeScanner'
import { useItemHistory } from '../hooks/useItemHistory'

function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso)
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days < 7 ? `${days}d ago` : `${Math.floor(days / 7)}w ago`
}

function getLastUnit(categoryId) {
  try { return localStorage.getItem(`unit-${categoryId}`) || 'pcs' } catch { return 'pcs' }
}
function saveLastUnit(categoryId, unit) {
  try { if (unit) localStorage.setItem(`unit-${categoryId}`, unit) } catch {}
}

export default function ItemModal({ item, categories, locations = [], defaultCategoryId, defaultName, onSave, onDelete, onDuplicate, onClose, onManageLocations }) {
  const isEdit  = !!item?.id
  const fileRef = useRef()
  const aiRef   = useRef()

  const initialCategoryId = item?.categoryId ?? defaultCategoryId ?? (categories[1]?.id ?? 'groceries')

  const [form, setForm] = useState({
    name:        item?.name        ?? defaultName ?? '',
    categoryId:  initialCategoryId,
    qty:         item?.qty         ?? 1,
    restockQty:  item?.restockQty  ?? 2,
    fullQty:     item?.fullQty     ?? 0,
    unit:        item?.unit        ?? getLastUnit(initialCategoryId),
    notes:       item?.notes       ?? '',
    location:    item?.location    ?? '',
    locationId:  item?.locationId  ?? null,
    image:       item?.image       ?? null,
    expiryDate:  item?.expiryDate  ?? '',
    price:       item?.price       != null ? String(item.price) : '',
    recurDays:   item?.recurDays   ?? '',
    store:       item?.store       ?? '',
  })
  const [scanning,     setScanning]     = useState(false)
  const [scanError,    setScanError]    = useState(null)
  const [showScanner,  setShowScanner]  = useState(false)
  const [showMore, setShowMore] = useState(
    isEdit && !!(item?.fullQty || item?.location || item?.locationId || item?.notes || item?.expiryDate || item?.price || item?.recurDays)
  )
  const [showHistory, setShowHistory] = useState(false)

  const { history } = useItemHistory(isEdit && showHistory ? item.id : null)

  function set(key, val) {
    setForm(prev => {
      const next = { ...prev, [key]: val }
      // When category changes on a new item, suggest the remembered unit for that category
      if (key === 'categoryId' && !isEdit) {
        next.unit = getLastUnit(val)
      }
      return next
    })
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
        if (!res.ok) throw new Error()
        const data = await res.json()
        const nameFound = data.name && data.name.trim().length > 2
        if (nameFound) {
          set('name', data.name)
          if (data.unit) set('unit', data.unit)
          if (data.notes) set('notes', data.notes)
        } else {
          // API responded but couldn't identify the item
          setScanError('Couldn\'t identify this item — try better lighting, get closer, or fill in manually.')
        }
      } catch {
        setScanError('Scan failed — check your connection and try again.')
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleBarcodeDetect({ barcode, name, unit, brand }) {
    if (name) set('name', name)
    if (unit) set('unit', unit.replace(/^\d+\s*/, '').trim() || form.unit)
    if (brand && !form.notes) set('notes', brand)
    setShowScanner(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    saveLastUnit(form.categoryId, form.unit)
    onSave({
      ...item,
      ...form,
      qty:        Number(form.qty),
      restockQty: Number(form.restockQty),
      fullQty:    Number(form.fullQty) || 0,
      price:      form.price !== '' ? Number(form.price)    : null,
      recurDays:  form.recurDays !== '' ? Number(form.recurDays) : null,
      expiryDate: form.expiryDate || null,
    })
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  const catColor = categories.find(c => c.id === form.categoryId)?.color ?? '#f9a8d4'

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
        onClick={handleBackdrop}
      >
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-modal animate-slide-up">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
          </div>

          <div className="px-5 pb-6 pt-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-title text-2xl text-blush-400">
                {isEdit ? 'Edit Item ✏️' : 'Add Item ✨'}
              </h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 hover:bg-gray-200 transition-all">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-blush-200 dark:border-blush-400/30 bg-blush-50 dark:bg-blush-500/10 overflow-hidden flex items-center justify-center">
                  {scanning ? (
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 border-4 border-lavender-300 border-t-lavender-500 rounded-full animate-spin" />
                      <span className="text-xs font-sans text-lavender-400 font-semibold">Reading…</span>
                    </div>
                  ) : form.image ? (
                    <img src={form.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>

                <div className="flex gap-2 flex-wrap justify-center">
                  <button
                    type="button"
                    onClick={() => { aiRef.current.value = ''; aiRef.current?.click() }}
                    disabled={scanning}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans font-bold text-sm text-white bg-gradient-to-r from-lavender-400 to-blush-400 shadow hover:shadow-md hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <span>✨</span>
                    <span>{scanning ? 'Scanning…' : 'AI Scan'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { fileRef.current.value = ''; fileRef.current?.click() }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans font-bold text-sm text-blush-400 bg-blush-50 dark:bg-blush-500/10 border-2 border-blush-200 dark:border-blush-400/30 hover:bg-blush-100 transition-all"
                  >
                    <span>📷</span>
                    <span>Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans font-bold text-sm text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 border-2 border-lavender-200 dark:border-lavender-400/30 hover:bg-lavender-100 transition-all"
                  >
                    <span>📊</span>
                    <span>Barcode</span>
                  </button>
                </div>

                <input ref={aiRef}   type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAIScan}  aria-label="AI scan" />
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImage}   aria-label="Upload photo" />

                {scanError && <p className="text-xs font-sans text-peach-400 text-center">{scanError}</p>}
                {form.image && !scanning && (
                  <button type="button" onClick={() => set('image', null)} className="text-xs font-sans text-gray-400 hover:text-red-400 transition-colors">
                    Remove photo
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Item Name *</label>
                <input
                  type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Baby wipes, Milk, Shampoo…" required
                  className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-blush-300 transition-colors bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.filter(c => c.id !== 'all').map(cat => (
                    <button
                      type="button" key={cat.id} onClick={() => set('categoryId', cat.id)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-sans font-bold transition-all ${
                        form.categoryId === cat.id ? 'text-white shadow-sm scale-105' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200'
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
                {[
                  { key: 'qty',        label: 'Qty',        border: 'border-mint-200',   bg: 'bg-mint-50/50',   focus: 'focus:border-mint-300' },
                  { key: 'restockQty', label: 'Restock at', border: 'border-peach-200',  bg: 'bg-peach-50/50',  focus: 'focus:border-peach-300' },
                  { key: 'unit',       label: 'Unit',       border: 'border-sky-200',    bg: 'bg-sky-50/50',    focus: 'focus:border-sky-300',   type: 'text' },
                ].map(({ key, label, border, bg, focus, type }) => (
                  <div key={key}>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">{label}</label>
                    <input
                      type={type || 'number'} min="0" value={form[key]}
                      onChange={e => set(key, e.target.value)}
                      placeholder={key === 'unit' ? 'pcs' : undefined}
                      className={`w-full rounded-2xl border-2 ${border} ${bg} dark:bg-gray-700/50 dark:border-gray-600 px-3 py-2.5 font-sans font-bold text-sm text-center focus:outline-none ${focus} transition-colors dark:text-white`}
                    />
                  </div>
                ))}
              </div>

              {/* More options toggle */}
              <button
                type="button" onClick={() => setShowMore(v => !v)}
                className="flex items-center gap-1.5 font-sans text-sm text-lavender-400 font-bold hover:text-lavender-500 transition-colors"
              >
                <span className={`transition-transform duration-200 inline-block ${showMore ? 'rotate-180' : ''}`}>▾</span>
                {showMore ? 'Fewer options' : 'More options'}
              </button>

              {showMore && (
                <>
                  {/* Full level */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Full level 🔝 <span className="font-normal text-gray-400">optional</span></label>
                    <input
                      type="number" min="0" value={form.fullQty} onChange={e => set('fullQty', e.target.value)}
                      placeholder="e.g. 6"
                      className="w-full rounded-2xl border-2 border-mint-200 dark:border-mint-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-mint-300 bg-mint-50/50 dark:bg-mint-500/10 dark:text-white transition-colors"
                    />
                    <p className="font-sans text-xs text-gray-400 mt-1">Shows "Set to full" on card when stock is low</p>
                  </div>

                  {/* Expiry date */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Expiry Date 📅 <span className="font-normal text-gray-400">optional</span></label>
                    <input
                      type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)}
                      className="w-full rounded-2xl border-2 border-amber-200 dark:border-amber-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-amber-300 bg-amber-50/50 dark:bg-amber-500/10 dark:text-white transition-colors"
                    />
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Price 💰 <span className="font-normal text-gray-400">optional</span></label>
                    <input
                      type="number" min="0" step="0.01" value={form.price}
                      onChange={e => set('price', e.target.value)}
                      placeholder="e.g. 3.50"
                      className="w-full rounded-2xl border-2 border-mint-200 dark:border-mint-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-mint-300 bg-mint-50/50 dark:bg-mint-500/10 dark:text-white transition-colors"
                    />
                    <p className="font-sans text-xs text-gray-400 mt-1">Used to estimate total inventory value</p>
                  </div>

                  {/* Recurring reminder */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Recurring reminder 🔁 <span className="font-normal text-gray-400">optional</span></label>
                    <input
                      type="number" min="1" value={form.recurDays}
                      onChange={e => set('recurDays', e.target.value)}
                      placeholder="e.g. 7 for weekly"
                      className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-lavender-300 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white transition-colors"
                    />
                    <p className="font-sans text-xs text-gray-400 mt-1">Flag on dashboard after this many days since last restock</p>
                  </div>

                  {/* Location */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-sans font-bold text-sm text-gray-600 dark:text-gray-300">Where stored? 📍</label>
                      {onManageLocations && (
                        <button type="button" onClick={onManageLocations} className="text-xs font-sans text-lavender-400 hover:text-lavender-500 transition-colors">
                          + Manage
                        </button>
                      )}
                    </div>
                    {locations.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button" onClick={() => set('locationId', null)}
                          className={`rounded-xl border-2 py-2 font-sans text-xs font-bold transition-all ${!form.locationId ? 'border-blush-300 bg-blush-50 dark:bg-blush-500/10 text-blush-400' : 'border-gray-100 dark:border-gray-600 text-gray-400 hover:border-gray-200'}`}
                        >None</button>
                        {locations.map(loc => (
                          <button
                            type="button" key={loc.id} onClick={() => set('locationId', loc.id)}
                            className={`relative rounded-xl border-2 overflow-hidden transition-all ${form.locationId === loc.id ? 'border-blush-400 ring-2 ring-blush-200' : 'border-gray-100 dark:border-gray-600 hover:border-gray-200'}`}
                          >
                            {loc.photo
                              ? <img src={loc.photo} alt="" className="w-full h-14 object-cover" />
                              : <div className="w-full h-14 bg-lavender-50 dark:bg-lavender-500/10 flex items-center justify-center text-2xl">📍</div>
                            }
                            <p className="font-sans text-xs font-bold text-gray-700 dark:text-gray-200 px-1 py-1 truncate text-center bg-white dark:bg-gray-800">{loc.name}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text" value={form.location} onChange={e => set('location', e.target.value)}
                          placeholder="e.g. Kitchen cabinet, Under sink…"
                          className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-lavender-400 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white transition-colors"
                        />
                        {onManageLocations && (
                          <p className="font-sans text-xs text-gray-400">
                            💡 <button type="button" onClick={onManageLocations} className="text-lavender-400 underline">Add location photos</button> to pick visually
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Store */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Store 🏪 <span className="font-normal text-gray-400">optional</span></label>
                    <input
                      type="text" value={form.store} onChange={e => set('store', e.target.value)}
                      placeholder="e.g. Costco, Walmart, Target…"
                      className="w-full rounded-2xl border-2 border-sky-200 dark:border-sky-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-sky-300 bg-sky-50/50 dark:bg-sky-500/10 dark:text-white transition-colors"
                    />
                    <p className="font-sans text-xs text-gray-400 mt-1">Groups your shopping list by store</p>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-1">Notes 📝</label>
                    <textarea
                      value={form.notes} onChange={e => set('notes', e.target.value)}
                      placeholder="Brand preference, storage tips…"
                      rows={2}
                      className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-400/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-lavender-300 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white resize-none transition-colors"
                    />
                  </div>
                </>
              )}

              {/* Item history (edit only) */}
              {isEdit && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowHistory(v => !v)}
                    className="flex items-center gap-1.5 font-sans text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <span className={`transition-transform duration-200 inline-block ${showHistory ? 'rotate-180' : ''}`}>▾</span>
                    Qty history
                  </button>
                  {showHistory && (
                    <div className="mt-2 space-y-1.5">
                      {history.length === 0 ? (
                        <p className="font-sans text-xs text-gray-400 italic pl-1">No changes recorded yet</p>
                      ) : history.map(h => (
                        <div key={h.id} className="flex items-center gap-2 text-xs font-sans text-gray-500 dark:text-gray-400">
                          <span className="font-bold text-gray-700 dark:text-gray-200">{h.old_qty} → {h.new_qty}</span>
                          <span className="text-gray-400">{h.user_name ?? 'Unknown'}</span>
                          <span className="text-gray-300 dark:text-gray-600 ml-auto flex-shrink-0">{timeAgo(h.changed_at)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {isEdit && (
                  <>
                    <button
                      type="button" onClick={() => onDelete(item.id)}
                      className="flex-shrink-0 w-11 h-11 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-100 transition-all text-lg"
                      title="Delete"
                    >🗑️</button>
                    {onDuplicate && (
                      <button
                        type="button" onClick={() => { onDuplicate(item.id); onClose() }}
                        className="flex-shrink-0 w-11 h-11 rounded-2xl bg-lavender-50 dark:bg-lavender-500/10 text-lavender-400 flex items-center justify-center hover:bg-lavender-100 transition-all text-lg"
                        title="Duplicate"
                      >📋</button>
                    )}
                  </>
                )}
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl font-sans font-bold text-white text-base shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${catColor}, #f472b6)` }}
                >
                  {isEdit ? 'Save Changes ✨' : 'Add to Inventory 🎉'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Barcode scanner overlay */}
      {showScanner && (
        <BarcodeScanner
          onDetect={handleBarcodeDetect}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  )
}
