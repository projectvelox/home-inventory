import React, { useMemo } from 'react'

export default function ExpiryCalendar({ items, categories }) {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const in7   = useMemo(() => new Date(today.getTime() + 7 * 86400000),  [today])
  const eom   = useMemo(() => new Date(today.getFullYear(), today.getMonth() + 1, 0), [today])

  const withExpiry = useMemo(() =>
    items
      .filter(i => i.expiryDate)
      .map(i => ({ ...i, expDate: new Date(i.expiryDate + 'T00:00:00') }))
      .sort((a, b) => a.expDate - b.expDate),
    [items]
  )

  const groups = useMemo(() => [
    {
      key: 'expired', label: 'Already Expired', icon: '🚨',
      items: withExpiry.filter(i => i.expDate < today),
      chipClass: 'bg-red-500 text-white',
      cardClass: 'border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10',
      textClass: 'text-red-600 dark:text-red-400',
    },
    {
      key: 'week', label: 'This Week', icon: '⚠️',
      items: withExpiry.filter(i => i.expDate >= today && i.expDate < in7),
      chipClass: 'bg-amber-400 text-white',
      cardClass: 'border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10',
      textClass: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'month', label: 'This Month', icon: '📅',
      items: withExpiry.filter(i => i.expDate >= in7 && i.expDate <= eom),
      chipClass: 'bg-peach-400 text-white',
      cardClass: 'border-peach-200 dark:border-peach-500/30 bg-peach-50 dark:bg-peach-500/10',
      textClass: 'text-peach-500 dark:text-peach-400',
    },
    {
      key: 'later', label: 'Later', icon: '✅',
      items: withExpiry.filter(i => i.expDate > eom),
      chipClass: 'bg-mint-400 text-white',
      cardClass: 'border-mint-200 dark:border-mint-500/30 bg-mint-50 dark:bg-mint-500/10',
      textClass: 'text-mint-600 dark:text-mint-400',
    },
  ].filter(g => g.items.length > 0), [withExpiry, today, in7, eom])

  if (withExpiry.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📅</div>
        <p className="font-sans font-semibold text-gray-500 dark:text-gray-400 mb-1">No expiry dates set</p>
        <p className="font-sans text-sm text-gray-400 dark:text-gray-500">
          Open any item and set an expiry date to track it here.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 pb-10 animate-fade-in">

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 py-4">
        {groups.map(g => (
          <span key={g.key} className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-sans font-bold text-xs ${g.chipClass}`}>
            {g.icon} {g.items.length} {g.label.toLowerCase()}
          </span>
        ))}
      </div>

      {/* Groups */}
      <div className="space-y-6">
        {groups.map(group => (
          <div key={group.key}>
            <h3 className={`font-sans font-bold text-sm mb-3 flex items-center gap-2 ${group.textClass}`}>
              <span>{group.icon}</span>
              <span>{group.label}</span>
              <span className="text-gray-300 dark:text-gray-600 font-normal">({group.items.length})</span>
            </h3>

            <div className="space-y-2">
              {group.items.map(item => {
                const cat = categories.find(c => c.id === item.categoryId)
                const daysLeft = Math.ceil((item.expDate - today) / 86400000)
                const dateLabel = item.expDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                return (
                  <div key={item.id} className={`border rounded-2xl px-4 py-3 flex items-center gap-3 ${group.cardClass}`}>
                    {/* Thumbnail */}
                    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white/60 dark:bg-gray-700/60 flex items-center justify-center text-xl">
                      {item.image
                        ? <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        : cat?.emoji ?? '📦'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-sans font-bold text-sm truncate ${group.textClass}`}>{item.name}</p>
                      <p className="font-sans text-xs opacity-70 mt-0.5">{dateLabel}</p>
                      {item.qty > 0 && (
                        <p className="font-sans text-xs opacity-60">{item.qty} {item.unit || 'pcs'} remaining</p>
                      )}
                    </div>

                    {/* Days badge */}
                    <div className={`flex-shrink-0 w-14 text-center rounded-xl py-1.5 font-sans font-bold text-sm ${group.cardClass} border`}>
                      <p className={group.textClass}>
                        {daysLeft < 0
                          ? `${Math.abs(daysLeft)}d`
                          : daysLeft === 0 ? 'Today'
                          : `${daysLeft}d`}
                      </p>
                      <p className={`text-[10px] opacity-60 ${group.textClass}`}>
                        {daysLeft < 0 ? 'ago' : daysLeft === 0 ? '' : 'left'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
