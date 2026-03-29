import React, { useState, useRef } from 'react'

export default function LocationsPage({ locations, items, onAdd, onDelete, onReorder, canManage, onSelectLocation }) {
  const [adding,   setAdding]   = useState(false)
  const [form,     setForm]     = useState({ name: '', photo: null })
  const [saving,   setSaving]   = useState(false)
  const fileRef = useRef()

  // Drag state
  const dragId    = useRef(null)
  const dragOver  = useRef(null)
  const [dragging, setDragging] = useState(null) // id of card being dragged

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await onAdd({ name: form.name.trim(), photo: form.photo })
    setForm({ name: '', photo: null })
    setAdding(false)
    setSaving(false)
  }

  function itemCount(locId) {
    return items.filter(i => i.locationId === locId).length
  }

  // ── Drag handlers ────────────────────────────────────────────
  function onDragStart(e, id) {
    dragId.current = id
    setDragging(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnter(e, id) {
    e.preventDefault()
    dragOver.current = id
  }

  function onDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function onDrop(e, targetId) {
    e.preventDefault()
    if (!dragId.current || dragId.current === targetId) return
    const ids = locations.map(l => l.id)
    const from = ids.indexOf(dragId.current)
    const to   = ids.indexOf(targetId)
    if (from === -1 || to === -1) return
    const reordered = [...ids]
    reordered.splice(from, 1)
    reordered.splice(to, 0, dragId.current)
    onReorder?.(reordered)
  }

  function onDragEnd() {
    dragId.current   = null
    dragOver.current = null
    setDragging(null)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pb-10 animate-fade-in">

      {/* Add button */}
      {canManage && !adding && (
        <div className="pt-4 mb-4">
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
          >
            + Add Location
          </button>
        </div>
      )}

      {/* Add form */}
      {canManage && adding && (
        <div className="mb-5 bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 border-2 border-dashed border-lavender-200 dark:border-lavender-500/30 animate-fade-in">
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-3">New Location</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Kitchen Cabinet, Master Bedroom, Under Sink…"
              autoFocus
              className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-500/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-blush-300 bg-lavender-50/50 dark:bg-lavender-500/10 dark:text-white transition-colors"
            />
            <div className="flex items-center gap-3">
              {form.photo && (
                <div className="relative flex-shrink-0">
                  <img src={form.photo} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, photo: null }))}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-400 text-white text-xs flex items-center justify-center"
                  >✕</button>
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-xl font-sans font-bold text-sm text-blush-400 bg-white dark:bg-gray-700 border-2 border-blush-200 dark:border-blush-400/30 hover:bg-blush-50 transition-all"
              >
                📷 {form.photo ? 'Retake' : 'Take Photo'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setAdding(false); setForm({ name: '', photo: null }) }}
                className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.name.trim() || saving}
                className="flex-1 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Location'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Empty state */}
      {locations.length === 0 && !adding && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-6xl mb-4">📍</div>
          <p className="font-sans font-semibold text-gray-500 dark:text-gray-400 mb-1">No locations yet</p>
          <p className="font-sans text-sm text-gray-400 dark:text-gray-500">
            Take a photo of each storage spot in your home so items can be tagged to them.
          </p>
          {canManage && (
            <button
              onClick={() => setAdding(true)}
              className="mt-5 px-6 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow"
            >
              Add First Location
            </button>
          )}
        </div>
      )}

      {/* Drag hint */}
      {canManage && locations.length > 1 && (
        <p className="font-sans text-xs text-gray-400 dark:text-gray-500 mb-2 pt-1">
          ⠿ Drag cards to reorder
        </p>
      )}

      {/* Locations grid */}
      {locations.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {locations.map(loc => {
            const count   = itemCount(loc.id)
            const isDrag  = dragging === loc.id
            const isOver  = dragOver.current === loc.id && dragging && dragging !== loc.id
            return (
              <div
                key={loc.id}
                draggable={canManage}
                onDragStart={e => onDragStart(e, loc.id)}
                onDragEnter={e => onDragEnter(e, loc.id)}
                onDragOver={onDragOver}
                onDrop={e => onDrop(e, loc.id)}
                onDragEnd={onDragEnd}
                className={[
                  'group bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden transition-all hover:shadow-card-md hover:-translate-y-0.5 animate-fade-in',
                  canManage ? 'cursor-grab active:cursor-grabbing' : '',
                  isDrag  ? 'opacity-40 scale-95' : '',
                  isOver  ? 'ring-2 ring-blush-300 ring-offset-2' : '',
                ].filter(Boolean).join(' ')}
              >
                {/* Clickable photo + name area */}
                <button
                  onClick={() => onSelectLocation?.(loc.id)}
                  className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blush-300 focus:ring-inset rounded-2xl"
                  aria-label={`Filter inventory by ${loc.name}`}
                >
                  {/* Photo */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-lavender-50 to-blush-50 dark:from-gray-700 dark:to-gray-600 overflow-hidden relative">
                    {loc.photo ? (
                      <img src={loc.photo} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-40">📍</span>
                      </div>
                    )}
                    {/* Item count badge */}
                    {count > 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold text-white bg-black/50 backdrop-blur-sm">
                        {count} item{count !== 1 ? 's' : ''}
                      </div>
                    )}
                    {/* Drag handle indicator */}
                    {canManage && (
                      <div className="absolute top-2 right-8 text-white/60 text-sm opacity-0 group-hover:opacity-100 transition-opacity select-none pointer-events-none">
                        ⠿
                      </div>
                    )}
                    {/* Delete button */}
                    {canManage && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          if (confirm(`Remove "${loc.name}"? Items stored here will be untagged.`)) {
                            onDelete(loc.id)
                          }
                        }}
                        className="absolute top-2 right-2 w-7 h-7 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:scale-110"
                        title="Remove location"
                      >✕</button>
                    )}
                  </div>
                  {/* Name */}
                  <div className="px-3 py-2.5">
                    <p className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">{loc.name}</p>
                    <p className="font-sans text-xs text-gray-400 mt-0.5">
                      {count === 0 ? 'No items tagged' : `${count} item${count !== 1 ? 's' : ''} stored here`}
                    </p>
                    {onSelectLocation && count > 0 && (
                      <p className="font-sans text-[10px] text-blush-400 mt-0.5">Tap to filter →</p>
                    )}
                  </div>
                </button>
              </div>
            )
          })}

          {/* Add new card (inline) */}
          {canManage && !adding && (
            <button
              onClick={() => setAdding(true)}
              className="aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blush-300 hover:text-blush-400 hover:bg-blush-50 dark:hover:bg-blush-500/10 transition-all"
            >
              <span className="text-2xl">+</span>
              <span className="font-sans font-semibold text-xs">Add Location</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
