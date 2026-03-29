import React from 'react'

export default function CategoryBar({ categories, selected, onSelect, onManage }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-3">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full font-cute font-bold text-sm transition-all duration-200 ${
              selected === cat.id
                ? 'text-white shadow-md scale-105'
                : 'bg-white/70 text-gray-500 hover:bg-white hover:shadow'
            }`}
            style={selected === cat.id ? { backgroundColor: cat.color, color: '#fff' } : {}}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
        <button
          onClick={onManage}
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full font-cute font-bold text-sm bg-white/70 text-lavender-400 border-2 border-dashed border-lavender-300 hover:bg-lavender-50 transition-all"
        >
          <span>+</span>
          <span>New</span>
        </button>
      </div>
    </div>
  )
}
