import React, { useMemo } from 'react'

function timeAgo(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso)
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7)  return `${days}d ago`
  return `${Math.floor(days / 7)}w ago`
}

function StatCard({ icon, value, label, sub, gradient, textColor, trend }) {
  const trendIcon  = trend == null ? null : trend.delta > 0 ? '↑' : trend.delta < 0 ? '↓' : '→'
  const trendColor = trend == null ? '' : trend.delta > 0 ? 'text-red-300' : trend.delta < 0 ? 'text-green-300' : 'opacity-50'
  return (
    <div className={`rounded-2xl p-4 relative overflow-hidden ${gradient}`}>
      {/* Background decorative circle */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 bg-white" />
      <div className="relative z-10">
        <span className="text-xl block mb-2 leading-none">{icon}</span>
        <div className="flex items-end gap-1.5">
          <span className={`font-sans font-extrabold text-[1.6rem] leading-none ${textColor}`}>{value}</span>
          {trendIcon && (
            <span className={`font-sans font-bold text-sm leading-snug mb-0.5 ${trendColor}`}>
              {trendIcon}{Math.abs(trend.delta)}
            </span>
          )}
        </div>
        <p className={`font-sans font-semibold text-xs mt-1.5 ${textColor} opacity-80`}>{label}</p>
        {sub && <p className={`font-sans text-[10px] mt-0.5 ${textColor} opacity-55`}>{sub}</p>}
      </div>
    </div>
  )
}

export default function Dashboard({ items, categories, lowStockItems, expiringItems, overdueRecurItems }) {
  const totalValue = useMemo(() =>
    items.reduce((sum, i) => (i.price != null && i.qty ? sum + Number(i.price) * i.qty : sum), 0),
    [items]
  )

  // Estimated cost to restock all low stock items
  const shoppingCost = useMemo(() =>
    lowStockItems.reduce((sum, i) => {
      if (i.price == null) return sum
      const buyQty = i.fullQty > 0
        ? Math.max(0, i.fullQty - i.qty)
        : Math.max(1, i.restockQty - i.qty + 1)
      return sum + Number(i.price) * buyQty
    }, 0),
    [lowStockItems]
  )

  const catBreakdown = useMemo(() =>
    categories
      .filter(c => c.id !== 'all')
      .map(cat => ({
        ...cat,
        count: items.filter(i => i.categoryId === cat.id).length,
        low:   items.filter(i => i.categoryId === cat.id && i.qty <= i.restockQty && i.restockQty > 0).length,
      }))
      .filter(c => c.count > 0)
      .sort((a, b) => b.count - a.count),
    [items, categories]
  )

  const maxCount = Math.max(...catBreakdown.map(c => c.count), 1)

  const recentItems = useMemo(() =>
    [...items]
      .filter(i => i.updatedAt || i.createdAt)
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt) - new Date(a.updatedAt ?? a.createdAt))
      .slice(0, 6),
    [items]
  )

  const lowPct = items.length ? Math.round(lowStockItems.length / items.length * 100) : 0

  // Week-over-week trends based on updatedAt timestamps
  const trends = useMemo(() => {
    const now = Date.now()
    const week = 7 * 24 * 3600 * 1000
    // Items updated/created in the last 7 days vs prior 7 days
    const thisWeek = items.filter(i => (now - new Date(i.updatedAt ?? i.createdAt)) < week).length
    const lastWeek = items.filter(i => {
      const age = now - new Date(i.updatedAt ?? i.createdAt)
      return age >= week && age < 2 * week
    }).length

    // Low stock this week vs last week
    const lowNow  = lowStockItems.length
    // Approximate: count items that were updated last week and are currently low
    const lowLast = items.filter(i => {
      const age = now - new Date(i.updatedAt ?? i.createdAt)
      return age >= week && age < 2 * week && i.qty <= i.restockQty && i.restockQty > 0
    }).length

    return {
      items:    thisWeek - lastWeek,
      lowStock: lowNow   - lowLast,
    }
  }, [items, lowStockItems])

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">📊</div>
        <p className="font-sans font-semibold text-gray-500 dark:text-gray-400">Add items to see your dashboard</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pb-10 animate-fade-in">

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
        <StatCard
          icon="📦" value={items.length} label="Total Items"
          gradient="bg-gradient-to-br from-blush-300 to-blush-400"
          textColor="text-white"
          trend={trends.items !== 0 ? { delta: trends.items } : null}
        />
        <StatCard
          icon="⚠️" value={lowStockItems.length} label="Low Stock"
          sub={`${lowPct}% of inventory`}
          gradient={lowStockItems.length > 0
            ? 'bg-gradient-to-br from-peach-300 to-peach-400'
            : 'bg-gradient-to-br from-mint-300 to-mint-400'}
          textColor="text-white"
          trend={trends.lowStock !== 0 ? { delta: trends.lowStock } : null}
        />
        <StatCard
          icon="📅" value={expiringItems.length} label="Expiring Soon"
          sub="within 7 days"
          gradient={expiringItems.length > 0
            ? 'bg-gradient-to-br from-red-400 to-red-500'
            : 'bg-gradient-to-br from-lavender-300 to-lavender-400'}
          textColor="text-white"
        />
        <StatCard
          icon="💰" value={totalValue > 0 ? `$${totalValue.toFixed(0)}` : '—'} label="Est. Value"
          sub={totalValue > 0 ? undefined : 'add prices to track'}
          gradient="bg-gradient-to-br from-lavender-400 to-purple-400"
          textColor="text-white"
        />
        {shoppingCost > 0 && (
          <StatCard
            icon="🛒" value={`$${shoppingCost.toFixed(0)}`} label="Restock Est."
            sub={`${lowStockItems.filter(i => i.price != null).length} priced items`}
            gradient="bg-gradient-to-br from-mint-400 to-teal-400"
            textColor="text-white"
          />
        )}
      </div>

      {/* Overdue recurring */}
      {overdueRecurItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl px-4 py-3 mb-4 flex items-start gap-3">
          <span className="text-xl flex-shrink-0 mt-0.5">🔁</span>
          <div>
            <p className="font-sans font-bold text-sm text-amber-600 dark:text-amber-400">
              {overdueRecurItems.length} recurring item{overdueRecurItems.length !== 1 ? 's' : ''} overdue for restock
            </p>
            <p className="font-sans text-xs text-amber-500 mt-0.5 leading-relaxed">
              {overdueRecurItems.map(i => i.name).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {catBreakdown.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4 mb-4">
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-blush-300 to-lavender-400 inline-block" />
            By Category
          </h3>
          <div className="space-y-3">
            {catBreakdown.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{cat.emoji}</span>
                    <span className="font-sans text-sm font-semibold text-gray-600 dark:text-gray-300">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.low > 0 && (
                      <span className="font-sans text-[10px] font-bold text-white bg-peach-400 px-1.5 py-0.5 rounded-full">
                        {cat.low} low
                      </span>
                    )}
                    <span className="font-sans text-xs font-bold text-gray-500 dark:text-gray-400 w-6 text-right">{cat.count}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max(4, Math.round(cat.count / maxCount * 100))}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently updated */}
      {recentItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card p-4">
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-gradient-to-b from-mint-300 to-lavender-400 inline-block" />
            Recently Updated
          </h3>
          <div className="space-y-1">
            {recentItems.map(item => {
              const cat  = categories.find(c => c.id === item.categoryId)
              const isLow = item.qty <= item.restockQty && item.restockQty > 0
              const accentColor = cat?.color ?? '#c4b5fd'
              return (
                <div key={item.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all">
                  <div
                    className="w-9 h-9 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center text-lg"
                    style={{ background: `${accentColor}18` }}
                  >
                    {item.image
                      ? <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                      : cat?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="font-sans text-[11px] text-gray-400 truncate">
                      {item.updatedBy ? `${item.updatedBy} · ` : ''}{timeAgo(item.updatedAt ?? item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-sans font-bold text-sm ${isLow ? 'text-peach-500' : 'text-gray-600 dark:text-gray-300'}`}>
                      {item.qty} <span className="font-normal text-xs text-gray-400">{item.unit || 'pcs'}</span>
                    </p>
                    {isLow && <p className="font-sans text-[10px] text-peach-400 font-semibold">low stock</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
