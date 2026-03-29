import React from 'react'

export default function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
      <div className="text-7xl mb-4 animate-bounce-soft">🏠</div>
      <h2 className="font-title text-2xl text-blush-400 mb-2">Your home is ready!</h2>
      <p className="font-cute text-gray-400 text-sm mb-6">Start adding items to keep track of your household inventory ✨</p>
      <button
        onClick={onAdd}
        className="px-6 py-3 rounded-2xl font-cute font-bold text-white text-base shadow-md bg-gradient-to-r from-blush-300 to-lavender-400 hover:shadow-lg hover:scale-105 transition-all"
      >
        Add First Item 🎉
      </button>
    </div>
  )
}
