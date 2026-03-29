import React from 'react'

export default function Header({ lowStockCount }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-blush-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-title text-3xl text-blush-400 leading-none">My Home Haven</h1>
          <p className="font-cute text-xs text-lavender-400 font-semibold mt-0.5">Keep everything in order ✨</p>
        </div>
        <div className="text-3xl select-none">🏠</div>
      </div>
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-peach-100 to-blush-100 border-t border-peach-200 px-4 py-2">
          <div className="max-w-2xl mx-auto flex items-center gap-2">
            <span className="text-lg animate-bounce-soft">🛒</span>
            <p className="font-cute text-sm font-bold text-peach-400">
              {lowStockCount} {lowStockCount === 1 ? 'item needs' : 'items need'} restocking!
            </p>
          </div>
        </div>
      )}
    </header>
  )
}
