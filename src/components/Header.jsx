import React from 'react'

export default function Header({ lowStockCount, user, onLogout }) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur-md bg-white/70 border-b border-blush-100 shadow-sm">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-title text-3xl text-blush-400 leading-none">My Home Haven</h1>
          <p className="font-cute text-xs text-lavender-400 font-semibold mt-0.5">Keep everything in order ✨</p>
        </div>

        {/* User chip + logout */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-white/80 border border-blush-100 rounded-full px-2.5 py-1 shadow-sm">
            <span className="text-base leading-none">{user.avatar}</span>
            <span className="font-cute text-xs font-bold text-gray-600 max-w-[70px] truncate">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base hover:bg-gray-200 active:scale-95 transition-all"
          >
            🚪
          </button>
        </div>
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
