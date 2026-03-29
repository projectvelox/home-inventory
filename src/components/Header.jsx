import React from 'react'

export default function Header({ lowStockCount, user, onLogout, dark, onToggleDark }) {
  return (
    <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
      <div className="px-4 py-3 flex items-center justify-between">
        <h1 className="font-title text-2xl text-blush-400 leading-none">My Home Haven</h1>

        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={onToggleDark}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-full px-2.5 py-1">
            <span className="text-sm leading-none">{user.avatar}</span>
            <span className="font-sans text-xs font-semibold text-gray-600 dark:text-gray-300 max-w-[72px] truncate">
              {user.displayName}
            </span>
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all"
          >
            🚪
          </button>
        </div>
      </div>

      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-peach-50 to-blush-50 dark:from-peach-500/10 dark:to-blush-500/10 border-t border-peach-100 dark:border-peach-500/20 px-4 py-2 flex items-center gap-2">
          <span className="text-base">🛒</span>
          <p className="font-sans text-sm font-semibold text-peach-500">
            {lowStockCount} {lowStockCount === 1 ? 'item needs' : 'items need'} restocking
          </p>
        </div>
      )}
    </header>
  )
}
