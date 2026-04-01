import React, { useState, useRef } from 'react'

export default function LocationsManager({ locations, onAdd, onDelete, onClose }) {
  const [form, setForm] = useState({ name: '', photo: null })
  const fileRef = useRef()

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  function handlePhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, photo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onAdd({ name: form.name.trim(), photo: form.photo })
    setForm({ name: '', photo: null })
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={handleBackdrop}
    >
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-modal animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title text-2xl text-blush-400">Locations 📍</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all">✕</button>
          </div>

          {locations.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 mb-5">
              {locations.map(loc => (
                <div key={loc.id} className="rounded-2xl border-2 border-gray-100 dark:border-gray-700 overflow-hidden">
                  {loc.photo ? (
                    <img src={loc.photo} alt="" className="w-full h-28 object-cover" />
                  ) : (
                    <div className="w-full h-28 bg-lavender-50 dark:bg-lavender-500/10 flex items-center justify-center text-4xl">📍</div>
                  )}
                  <div className="flex items-center justify-between px-2.5 py-2 bg-white dark:bg-gray-800">
                    <span className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 truncate flex-1">{loc.name}</span>
                    <button
                      onClick={() => onDelete(loc.id)}
                      className="flex-shrink-0 w-8 h-8 rounded-full bg-red-50 dark:bg-red-500/10 text-red-300 dark:text-red-400 hover:bg-red-100 hover:text-red-400 transition-all flex items-center justify-center text-xs ml-1"
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="font-sans text-sm text-gray-400 dark:text-gray-500 text-center mb-5 py-4">
              No locations yet. Add your first one below!
            </p>
          )}

          <div className="bg-lavender-50/50 dark:bg-lavender-500/10 rounded-2xl p-4 border-2 border-dashed border-lavender-200 dark:border-lavender-500/30">
            <h3 className="font-sans font-bold text-sm text-gray-600 dark:text-gray-300 mb-3">Add new location</h3>
            <form onSubmit={handleAdd} className="space-y-3">
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Master Bedroom, Under Kitchen Sink..."
                className="w-full rounded-2xl border-2 border-lavender-200 dark:border-lavender-500/30 px-4 py-2.5 font-sans text-sm focus:outline-none focus:border-blush-300 bg-white dark:bg-gray-800 dark:text-white transition-colors"
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
                  className="flex items-center gap-2 px-3 py-2 rounded-xl font-sans font-bold text-sm text-blush-400 bg-white dark:bg-gray-800 border-2 border-blush-200 dark:border-blush-500/30 hover:bg-blush-50 dark:hover:bg-blush-500/10 transition-all"
                >
                  📷 {form.photo ? 'Retake' : 'Take photo'}
                </button>
                <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} aria-label="Take location photo" />
              </div>
              <button
                type="submit"
                disabled={!form.name.trim()}
                className="w-full py-3 rounded-2xl font-sans font-bold text-white text-sm shadow bg-gradient-to-r from-blush-300 to-lavender-400 hover:shadow-md transition-all disabled:opacity-50"
              >
                Save Location
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
