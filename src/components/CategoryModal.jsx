import React, { useState } from 'react'

const EMOJIS = ['🛒','🍼','🧹','🧴','🍪','💊','🐾','🎮','📚','🌿','🧺','🍳','🧃','🧸','🎨','🪴','🍫','🧇','🥦','🧻']
const COLORS = ['#f9a8d4','#86efac','#bae6fd','#d8b4fe','#fdba74','#fde68a','#a5f3fc','#6ee7b7','#fca5a5','#c4b5fd']

export default function CategoryModal({ onAdd, onClose }) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🛒')
  const [color, setColor] = useState('#f9a8d4')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), emoji, color })
    onClose()
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={handleBackdrop}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200"></div>
        </div>
        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title text-2xl text-lavender-400">New Category 🌸</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">✕</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-1">Category Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Baby Things, Snacks..."
                required
                className="w-full rounded-2xl border-2 border-lavender-200 px-4 py-2.5 font-cute text-sm focus:outline-none focus:border-lavender-400 bg-lavender-50/50"
              />
            </div>
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-2">Pick an Emoji</label>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button
                    type="button"
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${emoji === e ? 'bg-lavender-200 scale-110 shadow' : 'bg-gray-100 hover:bg-lavender-100'}`}
                  >{e}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block font-cute font-bold text-sm text-gray-600 mb-2">Pick a Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400 shadow' : 'hover:scale-110'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-2xl font-cute font-bold text-white text-base shadow-md hover:shadow-lg transition-all"
              style={{ backgroundColor: color }}
            >
              Create Category ✨
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
