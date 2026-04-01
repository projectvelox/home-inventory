import React, { useState } from 'react'

const VIEW_LABELS = {
  dashboard: 'Dashboard',
  inventory: 'My Inventory',
  shopping:  'Shopping List',
  locations: 'Locations',
  expiry:    'Expiry Calendar',
  wishlist:  'Wishlist',
  tasks:     'Tasks',
  help:      'Help & Guide',
}

export default function Header({ view, lowStockCount, user, onLogout, dark, onToggleDark }) {
  const [showMenu, setShowMenu] = useState(false)
  const pageLabel = VIEW_LABELS[view] ?? 'My Home Haven'

  return (
    <header className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="px-4 h-14 flex items-center justify-between gap-3">

        {/* Left: app + page title */}
        <div className="flex-1 min-w-0">
          <p className="font-title text-[11px] text-blush-300 leading-none tracking-wide select-none">My Home Haven</p>
          <h2 className="font-sans font-bold text-[15px] text-gray-800 dark:text-gray-100 leading-snug truncate mt-0.5">
            {pageLabel}
          </h2>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Dark mode */}
          <button
            onClick={onToggleDark}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-90 transition-all"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* User avatar — tap to open mini menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(v => !v)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blush-50 to-lavender-50 dark:from-blush-500/10 dark:to-lavender-500/10 border border-blush-100 dark:border-blush-500/20 rounded-full pl-1.5 pr-3 py-1 hover:brightness-95 active:scale-95 transition-all"
            >
              <span className="text-base leading-none">{user.avatar}</span>
              <span className="font-sans text-[11px] font-bold text-blush-400 max-w-[96px] truncate leading-none">
                {user.displayName?.split(' ')[0]}
              </span>
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-modal border border-gray-100 dark:border-gray-700 py-1.5 min-w-[140px] z-50 animate-fade-in"
              >
                <div className="px-3 pt-1.5 pb-2.5 border-b border-gray-100 dark:border-gray-700">
                  <p className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200">{user.displayName}</p>
                  <p className="font-sans text-[11px] text-gray-400 capitalize">{user.role}</p>
                </div>
                <button
                  onClick={onToggleDark}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                  {dark ? '☀️' : '🌙'} {dark ? 'Light mode' : 'Dark mode'}
                </button>
                <button
                  onClick={() => { setShowMenu(false); onLogout() }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left font-sans text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                >
                  🚪 Sign out
                </button>
              </div>
            )}

            {/* Backdrop */}
            {showMenu && (
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Low stock alert bar */}
      {lowStockCount > 0 && (
        <div className="bg-gradient-to-r from-peach-50 to-amber-50 dark:from-peach-500/10 dark:to-amber-500/10 border-t border-peach-100 dark:border-peach-500/20 px-4 py-1.5 flex items-center gap-2">
          <span className="text-sm">🛒</span>
          <p className="font-sans text-xs font-semibold text-peach-500">
            {lowStockCount} {lowStockCount === 1 ? 'item needs' : 'items need'} restocking
          </p>
        </div>
      )}
    </header>
  )
}
