import React from 'react'

export default function EmptyState({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-fade-in">
      {/* Layered icon illustration */}
      <div className="relative mb-6">
        <div className="w-28 h-28 rounded-[2rem] bg-gradient-to-br from-blush-100 to-lavender-100 dark:from-blush-500/10 dark:to-lavender-500/10 flex items-center justify-center shadow-md">
          <span className="text-5xl animate-bounce-soft">🏠</span>
        </div>
        {/* Floating accent dots */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-peach-300 to-peach-400 shadow-sm animate-pulse-soft" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-gradient-to-br from-mint-300 to-mint-400 shadow-sm" style={{ animationDelay: '0.4s' }} />
        <div className="absolute top-2 -left-3 w-3 h-3 rounded-full bg-lavender-300 opacity-70" />
      </div>

      <h2 className="font-title text-2xl text-blush-400 mb-2">Your home is ready!</h2>
      <p className="font-sans text-gray-400 text-sm mb-8 max-w-xs leading-relaxed dark:text-gray-500">
        Add your first household item to start tracking stock, expiry dates, and restocking needs.
      </p>

      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl font-sans font-bold text-white text-sm shadow-md bg-gradient-to-r from-blush-300 to-lavender-400 hover:shadow-lg hover:brightness-105 active:scale-95 transition-all"
        >
          <span className="text-base">+</span> Add First Item
        </button>
      )}

      {/* Feature hint pills */}
      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {['📦 Track stock', '📅 Expiry alerts', '🛒 Shopping list', '📊 Dashboard'].map(hint => (
          <span key={hint} className="font-sans text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
            {hint}
          </span>
        ))}
      </div>
    </div>
  )
}
