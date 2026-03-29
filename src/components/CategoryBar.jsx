import React, { useRef } from 'react'

export default function CategoryBar({ categories, selected, onSelect, onManage, canManage, items = [] }) {
  const scrollRef = useRef()

  // Count items per category for badges
  const countMap = {}
  items.forEach(i => {
    countMap[i.categoryId] = (countMap[i.categoryId] ?? 0) + 1
  })
  const allCount = items.length

  return (
    <div className="relative">
      {/* Fade edges to hint at scroll */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-[#fafaf9] dark:from-[#0f172a] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-[#fafaf9] dark:from-[#0f172a] to-transparent z-10 pointer-events-none" />

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => {
          const isAll    = cat.id === 'all'
          const count    = isAll ? allCount : (countMap[cat.id] ?? 0)
          const isActive = selected === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-sans font-bold text-sm transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md cat-pill-active scale-[1.04]'
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 shadow-sm hover:shadow-md hover:scale-[1.02] border border-gray-100 dark:border-gray-700'
              }`}
              style={isActive ? { backgroundColor: cat.color } : {}}
            >
              <span className="text-base leading-none">{cat.emoji}</span>
              <span>{cat.name}</span>
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}

        {canManage && (
          <button
            onClick={onManage}
            className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full font-sans font-bold text-sm bg-white dark:bg-gray-800 text-lavender-400 border border-dashed border-lavender-300 dark:border-lavender-500/40 hover:bg-lavender-50 dark:hover:bg-lavender-500/10 shadow-sm hover:shadow-md transition-all"
          >
            <span className="text-base leading-none">✦</span>
            <span>New</span>
          </button>
        )}
      </div>
    </div>
  )
}
