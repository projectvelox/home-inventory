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

function StatCard({ icon, value, label, sub, colorClass, trend }) {
  // trend: { delta: number, label: string } — positive = up, negative = down, null = no trend
  const trendIcon  = trend == null ? null : trend.delta > 0 ? '↑' : trend.delta < 0 ? '↓' : '→'
  const trendColor = trend == null ? '' : trend.delta > 0 ? 'text-red-400' : trend.delta < 0 ? 'text-mint-500' : 'opacity-50'
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="flex items-end gap-1.5">
        <div className="font-sans font-bold text-2xl leading-none">{value}</div>
        {trendIcon && (
          <span className={`font-sans font-bold text-sm leading-snug mb-0.5 ${trendColor}`}>
            {trendIcon} {Math.abs(trend.delta)}
          </span>
        )}
      </div>
      <div className="font-sans font-semibold text-sm mt-1 opacity-80">{label}</div>
      {sub && <div className="font-sans text-xs opacity-60 mt-0.5">{sub}</div>}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 auto-rows-auto">
        <StatCard
          icon="📦" value={items.length} label="Total Items"
          colorClass="bg-blush-50 dark:bg-blush-500/10 text-blush-500"
          trend={trends.items !== 0 ? { delta: trends.items } : null}
        />
        <StatCard
          icon="⚠️" value={lowStockItems.length} label="Low Stock"
          sub={`${lowPct}% of inventory`}
          colorClass="bg-peach-50 dark:bg-peach-500/10 text-peach-500"
          trend={trends.lowStock !== 0 ? { delta: trends.lowStock } : null}
        />
        <StatCard
          icon="📅" value={expiringItems.length} label="Expiring Soon"
          sub="within 7 days"
          colorClass={expiringItems.length > 0
            ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
            : 'bg-mint-50 dark:bg-mint-500/10 text-mint-600'}
        />
        <StatCard
          icon="💰" value={totalValue > 0 ? `$${totalValue.toFixed(0)}` : '—'} label="Est. Value"
          sub={totalValue > 0 ? `$${totalValue.toFixed(2)} total` : 'add prices to track'}
          colorClass="bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500"
        />
        {shoppingCost > 0 && (
          <StatCard
            icon="🛒" value={`$${shoppingCost.toFixed(0)}`} label="Shop Est."
            sub={`to restock ${lowStockItems.filter(i => i.price != null).length} items`}
            colorClass="bg-mint-50 dark:bg-mint-500/10 text-mint-600"
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
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-4">By Category</h3>
          <div className="space-y-3">
            {catBreakdown.map(cat => (
              <div key={cat.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-sans text-sm font-semibold text-gray-600 dark:text-gray-300">
                    {cat.emoji} {cat.name}
                  </span>
                  <div className="flex items-center gap-2">
                    {cat.low > 0 && (
                      <span className="font-sans text-xs font-bold text-peach-500">{cat.low} low</span>
                    )}
                    <span className="font-sans text-xs text-gray-400 dark:text-gray-500 w-5 text-right">{cat.count}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
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
          <h3 className="font-sans font-bold text-sm text-gray-700 dark:text-gray-200 mb-3">Recently Updated</h3>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/60">
            {recentItems.map(item => {
              const cat = categories.find(c => c.id === item.categoryId)
              const isLow = item.qty <= item.restockQty && item.restockQty > 0
              return (
                <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-lg">
                    {item.image
                      ? <img src={item.image} alt="" className="w-full h-full object-cover" loading="lazy" />
                      : cat?.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-100 truncate">{item.name}</p>
                    <p className="font-sans text-xs text-gray-400 truncate">
                      {item.updatedBy ? `${item.updatedBy} · ` : ''}{timeAgo(item.updatedAt ?? item.createdAt)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-sans font-bold text-sm ${isLow ? 'text-peach-500' : 'text-mint-500'}`}>
                      {item.qty} {item.unit || 'pcs'}
                    </p>
                    {item.price != null && (
                      <p className="font-sans text-[10px] text-gray-400">${Number(item.price).toFixed(2)}</p>
                    )}
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
