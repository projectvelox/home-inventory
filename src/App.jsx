import React, { useState, useRef, useMemo, useCallback, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import CategoryBar from './components/CategoryBar'
import ItemCard from './components/ItemCard'
import ItemModal from './components/ItemModal'
import CategoryModal from './components/CategoryModal'
import LocationsManager from './components/LocationsManager'
import EmptyState from './components/EmptyState'
import ShoppingList from './components/ShoppingList'
import SharedView from './components/SharedView'
import LocationsPage from './components/LocationsPage'
import LoginScreen from './components/LoginScreen'
import { useInventory } from './hooks/useInventory'
import { useWishlist } from './hooks/useWishlist'
import { usePWAInstall } from './hooks/usePWAInstall'
import { useAuth } from './hooks/useAuth'
import { useDarkMode } from './hooks/useDarkMode'
import { useNotifications } from './hooks/useNotifications'

// Heavy views — loaded only when first navigated to
const Dashboard      = lazy(() => import('./components/Dashboard'))
const ExpiryCalendar = lazy(() => import('./components/ExpiryCalendar'))
const WishlistPage   = lazy(() => import('./components/WishlistPage'))
// Modals — loaded only when opened
const BulkImport  = lazy(() => import('./components/BulkImport'))
const ShareModal  = lazy(() => import('./components/ShareModal'))
// New views
const TasksPage   = lazy(() => import('./components/TasksPage'))
const HelpPage    = lazy(() => import('./components/HelpPage'))

// ─── Root ────────────────────────────────────────────────────
export default function App() {
  const shareToken = useMemo(() => new URLSearchParams(window.location.search).get('share'), [])
  const { user, loading, login, logout } = useAuth()

  if (shareToken) return <SharedView token={shareToken} />
  if (loading)    return <SplashScreen />
  if (!user)      return <LoginScreen onLogin={login} />
  return <InventoryApp user={user} onLogout={logout} />
}

// ─── Inline view spinner (Suspense fallback for lazy views) ──
function ViewSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blush-100 border-t-blush-400 rounded-full animate-spin" />
    </div>
  )
}

// ─── Splash ──────────────────────────────────────────────────
function SplashScreen() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[#fafaf9] dark:bg-gray-900">
      <div className="text-6xl mb-4 animate-bounce-soft">🏠</div>
      <h1 className="font-title text-3xl text-blush-400">My Home Haven</h1>
      <div className="mt-6 w-7 h-7 border-[3px] border-blush-200 border-t-blush-400 rounded-full animate-spin" />
    </div>
  )
}

// ─── Desktop Sidebar ─────────────────────────────────────────
function Sidebar({ view, onView, lowStockCount, expiringCount, overdueCount, wishlistCount, user, onLogout,
                   canAdd, onAdd, canImport, onImport, onExport, dark, onToggleDark,
                   notifPermission, onRequestNotif, alertHour, onAlertHourChange }) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-20">
      <div className="px-6 pt-7 pb-5">
        <h1 className="font-title text-[1.6rem] leading-none text-blush-400">My Home Haven</h1>
        <p className="font-sans text-xs text-gray-400 mt-1 font-medium">Household inventory</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        <SidebarItem icon="📊" label="Dashboard"  active={view === 'dashboard'} onClick={() => onView('dashboard')} activeClass="bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500" />
        <SidebarItem icon="🏠" label="Inventory"  active={view === 'inventory'} onClick={() => onView('inventory')} activeClass="bg-blush-50 dark:bg-blush-500/10 text-blush-500" />
        <SidebarItem
          icon="🛒" label="To Buy"
          active={view === 'shopping'} onClick={() => onView('shopping')}
          activeClass="bg-peach-50 dark:bg-peach-500/10 text-peach-500"
          badge={lowStockCount > 0 ? lowStockCount : null}
        />
        <SidebarItem icon="📍" label="Locations"  active={view === 'locations'} onClick={() => onView('locations')} activeClass="bg-mint-50 dark:bg-mint-500/10 text-mint-600" />
        <SidebarItem icon="📅" label="Expiry"     active={view === 'expiry'}    onClick={() => onView('expiry')}    activeClass="bg-amber-50 dark:bg-amber-500/10 text-amber-500"
          badge={expiringCount > 0 ? expiringCount : null}
        />
        <SidebarItem
          icon="⭐" label="Wishlist"
          active={view === 'wishlist'} onClick={() => onView('wishlist')}
          activeClass="bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500"
          badge={wishlistCount > 0 ? wishlistCount : null}
        />
        <SidebarItem icon="✅" label="Tasks"    active={view === 'tasks'}    onClick={() => onView('tasks')}    activeClass="bg-mint-50 dark:bg-mint-500/10 text-mint-600" />
        <SidebarItem icon="❓" label="Help"     active={view === 'help'}     onClick={() => onView('help')}     activeClass="bg-lavender-50 dark:bg-lavender-500/10 text-lavender-400" />
        {overdueCount > 0 && (
          <div className="px-3 py-1.5 mt-1">
            <p className="font-sans text-xs text-amber-500 font-semibold">🔁 {overdueCount} overdue restock</p>
          </div>
        )}
      </nav>

      <div className="px-3 pb-2 space-y-1.5">
        {canAdd && (
          <button
            onClick={onAdd}
            className="w-full py-2.5 rounded-xl font-sans font-semibold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow-sm hover:shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
          >
            + Add Item
          </button>
        )}
        <div className="flex gap-1.5">
          {canImport && (
            <button
              onClick={onImport}
              className="flex-1 py-2 rounded-xl font-sans font-semibold text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
            >
              📥 Import
            </button>
          )}
          <button
            onClick={onExport}
            className="flex-1 py-2 rounded-xl font-sans font-semibold text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
          >
            📤 Export
          </button>
        </div>
      </div>

      <div className="px-3 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blush-50 dark:bg-blush-500/10 flex items-center justify-center text-base flex-shrink-0">
            {user.avatar}
          </div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 truncate leading-snug">{user.displayName}</p>
            <p className="font-sans text-xs text-gray-400">{user.role === 'admin' ? 'Full access' : 'Restock only'}</p>
          </div>
        </div>

        {notifPermission !== 'unsupported' && notifPermission !== 'granted' && (
          <button
            onClick={onRequestNotif}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-medium text-lavender-500 hover:bg-lavender-50 dark:hover:bg-lavender-500/10 transition-all"
          >
            🔔 Enable alerts
          </button>
        )}
        {notifPermission === 'granted' && (
          <div className="px-3 py-1.5">
            <p className="text-xs text-green-500 font-sans font-semibold mb-1">🔔 Alerts on</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-sans">Time:</span>
              <input
                type="time"
                value={`${String(alertHour).padStart(2, '0')}:00`}
                onChange={e => onAlertHourChange(parseInt(e.target.value.split(':')[0], 10))}
                className="text-xs font-sans font-semibold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-0.5 focus:outline-none w-24"
              />
            </div>
          </div>
        )}

        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          {dark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-medium text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-600 transition-all"
        >
          🚪 Sign out
        </button>

        <p className="px-3 pt-1 font-sans text-[10px] text-gray-300 dark:text-gray-600 select-none">
          v{__APP_VERSION__} · {__BUILD_DATE__}
        </p>
      </div>
    </aside>
  )
}

// ─── Helper Sidebar (simplified) ─────────────────────────────
function HelperSidebar({ user, onLogout, dark, onToggleDark }) {
  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-[220px] bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-20">
      <div className="px-6 pt-7 pb-5">
        <h1 className="font-title text-[1.6rem] leading-none text-blush-400">My Home Haven</h1>
        <p className="font-sans text-xs text-gray-400 mt-1 font-medium">Helper Dashboard</p>
      </div>
      <nav className="flex-1 px-3">
        <SidebarItem icon="✅" label="My Tasks" active onClick={() => {}} activeClass="bg-mint-50 dark:bg-mint-500/10 text-mint-600" />
        <SidebarItem icon="❓" label="Help" active={false} onClick={() => {}} activeClass="bg-lavender-50 dark:bg-lavender-500/10 text-lavender-400" />
      </nav>
      <div className="px-3 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blush-50 dark:bg-blush-500/10 flex items-center justify-center text-base">{user.avatar}</div>
          <div className="min-w-0">
            <p className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-200 truncate">{user.displayName ?? user.display_name ?? ''}</p>
            <p className="font-sans text-xs text-gray-400">Helper</p>
          </div>
        </div>
        <button onClick={onToggleDark} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
          {dark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-sans text-xs font-medium text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
          🚪 Sign out
        </button>
      </div>
    </aside>
  )
}

function SidebarItem({ icon, label, active, onClick, activeClass, badge }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-sans font-semibold text-sm transition-all ${
        active ? activeClass : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200'
      }`}
    >
      <span className="text-base">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-peach-400 text-white text-xs font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Bottom Navigation Bar (mobile) ──────────────────────────
function BottomNav({ view, onView, isHelper, lowStockCount, expiringCount, wishlistCount }) {
  const [showMore, setShowMore] = useState(false)

  const mainItems = isHelper ? [
    { v: 'tasks', icon: '✅', label: 'Tasks' },
    { v: 'help',  icon: '❓', label: 'Help'  },
  ] : [
    { v: 'inventory', icon: '🏠', label: 'Home'  },
    { v: 'tasks',     icon: '✅', label: 'Tasks' },
    { v: 'shopping',  icon: '🛒', label: 'To Buy', badge: lowStockCount },
    { v: 'dashboard', icon: '📊', label: 'Stats' },
  ]

  const moreItems = [
    { v: 'locations', icon: '📍', label: 'Locations' },
    { v: 'expiry',    icon: '📅', label: 'Expiry',   badge: expiringCount },
    { v: 'wishlist',  icon: '⭐', label: 'Wishlist', badge: wishlistCount },
    { v: 'help',      icon: '❓', label: 'Help' },
  ]

  const moreActive = !mainItems.some(i => i.v === view) && view !== 'tasks'

  return (
    <>
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-100 dark:border-gray-800 shadow-[0_-2px_16px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-[58px] px-1">
          {mainItems.map(({ v, icon, label, badge }) => (
            <button
              key={v} onClick={() => { onView(v); setShowMore(false) }}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-xl transition-all relative ${
                view === v && !showMore
                  ? 'text-blush-400'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
              }`}
            >
              {view === v && !showMore && (
                <span className="absolute inset-0 rounded-xl bg-blush-50 dark:bg-blush-500/10" />
              )}
              <span className="text-[18px] leading-none relative z-10">{icon}</span>
              <span className="font-sans text-[10px] font-semibold leading-none relative z-10">{label}</span>
              {badge > 0 && (
                <span className="absolute top-1 right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-peach-400 text-white text-[8px] font-bold flex items-center justify-center z-20">
                  {badge}
                </span>
              )}
            </button>
          ))}
          {!isHelper && (
            <button
              onClick={() => setShowMore(v => !v)}
              className={`flex flex-col items-center gap-0.5 min-w-[56px] px-2 py-1.5 rounded-xl transition-all relative ${
                showMore || moreActive ? 'text-lavender-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {(showMore || moreActive) && (
                <span className="absolute inset-0 rounded-xl bg-lavender-50 dark:bg-lavender-500/10" />
              )}
              <span className="text-[18px] leading-none relative z-10">⋯</span>
              <span className="font-sans text-[10px] font-semibold leading-none relative z-10">More</span>
            </button>
          )}
        </div>
      </nav>

      {/* More sheet */}
      {showMore && (
        <div className="lg:hidden fixed inset-0 z-40" onClick={() => setShowMore(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl p-5 animate-slide-up"
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-5" />
            <div className="grid grid-cols-4 gap-3">
              {moreItems.map(({ v, icon, label, badge }) => (
                <button
                  key={v}
                  onClick={() => { onView(v); setShowMore(false) }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all relative ${
                    view === v ? 'bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="font-sans text-xs font-semibold">{label}</span>
                  {badge > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-peach-400 text-white text-[9px] font-bold flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Main App ────────────────────────────────────────────────
function InventoryApp({ user, onLogout }) {
  const {
    items, categories, locations, lowStockItems, expiringItems, overdueRecurItems, loading,
    addItem, updateItem, deleteItem, duplicateItem, addCategory,
    addLocation, deleteLocation, reorderLocations,
  } = useInventory(user?.displayName)
  const wishlist = useWishlist(user?.id)
  const { canInstall, install, dismiss } = usePWAInstall()
  const [dark, toggleDark] = useDarkMode()
  const { permission: notifPermission, requestPermission, notifyIfDue, alertHour, setAlertHour } = useNotifications()

  const isAdmin  = user?.role === 'admin'
  const isHelper = user?.role === 'helper'
  const permissions = useMemo(() => ({
    canAdd:              isAdmin,
    canEdit:             isAdmin,
    canDelete:           isAdmin,
    canManageCategories: isAdmin,
    canManageLocations:  isAdmin,
    canUpdateQty:        true,
  }), [isAdmin])

  const [view,              setView]              = useState(isHelper ? 'tasks' : 'inventory')
  const [selectedCategory,  setSelectedCategory]  = useState('all')
  const [locationFilter,    setLocationFilter]    = useState(null)   // location id or null
  const [activeFilters,     setActiveFilters]     = useState(new Set()) // 'low' | 'expiring'
  const [editingItem,       setEditingItem]       = useState(null)
  const [showAddModal,      setShowAddModal]      = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showLocationModal, setShowLocationModal] = useState(false)
  const [showShareModal,    setShowShareModal]    = useState(false)
  const [showBulkImport,    setShowBulkImport]    = useState(false)
  const [searchQuery,       setSearchQuery]       = useState('')
  const [sortBy,            setSortBy]            = useState('low-stock')
  const [toast,             setToast]             = useState(null)
  const toastTimer = useRef(null)

  useEffect(() => { notifyIfDue(lowStockItems.length) }, [lowStockItems.length, notifyIfDue])

  function showToast(msg) {
    clearTimeout(toastTimer.current)
    setToast(msg)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  const categoryMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories])
  const locationMap = useMemo(() => new Map(locations.map(l => [l.id, l])), [locations])

  // Toggle a quick filter pill
  function toggleFilter(key) {
    setActiveFilters(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const filteredItems = useMemo(() => {
    let result = selectedCategory === 'all'
      ? items
      : items.filter(i => i.categoryId === selectedCategory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q) ||
        i.store?.toLowerCase().includes(q)
      )
    }

    if (locationFilter) {
      result = result.filter(i => i.locationId === locationFilter)
    }

    if (activeFilters.has('low')) {
      result = result.filter(i => i.qty <= i.restockQty && i.restockQty > 0)
    }

    if (activeFilters.has('expiring')) {
      const in7 = new Date(Date.now() + 7 * 86400000)
      result = result.filter(i => {
        if (!i.expiryDate) return false
        return new Date(i.expiryDate + 'T00:00:00') <= in7
      })
    }

    if (sortBy === 'a-z') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0)
      )
    } else if (sortBy === 'expiry') {
      result = [...result].sort((a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0
        if (!a.expiryDate) return 1
        if (!b.expiryDate) return -1
        return new Date(a.expiryDate) - new Date(b.expiryDate)
      })
    } else {
      result = [...result].sort((a, b) => {
        const aLow = a.qty <= a.restockQty && a.restockQty > 0 ? 0 : 1
        const bLow = b.qty <= b.restockQty && b.restockQty > 0 ? 0 : 1
        if (aLow !== bLow) return aLow - bLow
        return a.name.localeCompare(b.name)
      })
    }
    return result
  }, [items, selectedCategory, searchQuery, sortBy, locationFilter, activeFilters])

  // Location card clicked → go to inventory with that location pre-filtered
  function handleSelectLocation(locId) {
    setLocationFilter(locId)
    setSelectedCategory('all')
    setActiveFilters(new Set())
    setView('inventory')
  }

  function clearLocationFilter() {
    setLocationFilter(null)
  }

  // Full inventory CSV export
  function exportFullInventory() {
    const headers = ['Name', 'Category', 'Store', 'Qty', 'Unit', 'Restock at', 'Full level', 'Price', 'Expiry Date', 'Location', 'Notes', 'Last Updated']
    const rows = items.map(item => {
      const cat = categories.find(c => c.id === item.categoryId)
      const loc = locationMap.get(item.locationId)
      return [
        item.name,
        cat?.name ?? '',
        item.store ?? '',
        item.qty,
        item.unit || 'pcs',
        item.restockQty,
        item.fullQty || 0,
        item.price != null ? Number(item.price).toFixed(2) : '',
        item.expiryDate ?? '',
        loc?.name ?? item.location ?? '',
        item.notes ?? '',
        item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '',
      ]
    })
    const csv = [headers, ...rows]
      .map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), {
      href: url,
      download: `inventory-${new Date().toISOString().split('T')[0]}.csv`,
    }).click()
    URL.revokeObjectURL(url)
    showToast('Inventory exported 📊')
  }

  const handleUpdateQty = useCallback((id, qty) => updateItem(id, { qty }), [updateItem])
  const handleEdit      = useCallback(setEditingItem, [])
  const handleDelete    = useCallback((id) => {
    if (confirm('Remove this item?')) { deleteItem(id); setEditingItem(null) }
  }, [deleteItem])
  const handleSave = useCallback((itemData) => {
    if (itemData.id) {
      updateItem(itemData.id, itemData)
      showToast('Changes saved ✨')
    } else {
      addItem(itemData)
      showToast(`${itemData.name} added! 🎉`)
    }
    setEditingItem(null)
    setShowAddModal(false)
  }, [updateItem, addItem])
  const handleDuplicate  = useCallback((id) => { duplicateItem(id); showToast('Item duplicated! 📋') }, [duplicateItem])
  const [addModalDefaultName, setAddModalDefaultName] = useState('')
  const handleOpenAdd    = useCallback(() => { setAddModalDefaultName(''); setShowAddModal(true) }, [])
  const handleCloseModal = useCallback(() => { setEditingItem(null); setShowAddModal(false); setAddModalDefaultName('') }, [])

  // When adding from a filtered category, pre-select that category in the modal
  const defaultCategoryId = selectedCategory !== 'all' ? selectedCategory : null

  // Wishlist → promote to inventory
  async function handlePromoteWishlist(itemData) {
    await addItem(itemData)
    showToast(`${itemData.name} added to inventory! 🎉`)
  }

  if (loading) return <SplashScreen />

  const SORT_OPTS = [
    { key: 'low-stock', label: '⚠️', title: 'Low stock first' },
    { key: 'a-z',       label: 'A–Z', title: 'Alphabetical' },
    { key: 'recent',    label: '🕐',  title: 'Recently updated' },
    { key: 'expiry',    label: '📅',  title: 'Expiring soonest' },
  ]

  const activeLocationName = locationFilter ? locationMap.get(locationFilter)?.name : null

  const VIEW_TITLES = {
    dashboard: 'Dashboard',
    inventory: 'Inventory',
    shopping:  'Shopping List',
    locations: 'Locations',
    expiry:    'Expiry Calendar',
    wishlist:  'Wishlist',
    tasks:     'Tasks',
    help:      'Help & Guide',
  }

  return (
    <div className="min-h-[100dvh] bg-[#fafaf9] dark:bg-gray-900 lg:flex">

      {/* ── Desktop sidebar ───── */}
      {isHelper ? (
        <HelperSidebar user={user} onLogout={onLogout} dark={dark} onToggleDark={toggleDark} />
      ) : (
        <Sidebar
          view={view} onView={setView}
          lowStockCount={lowStockItems.length}
          expiringCount={expiringItems.length}
          overdueCount={overdueRecurItems.length}
          wishlistCount={wishlist.items.length}
          user={user} onLogout={onLogout}
          canAdd={permissions.canAdd} onAdd={handleOpenAdd}
          canImport={permissions.canAdd} onImport={() => setShowBulkImport(true)}
          onExport={exportFullInventory}
          dark={dark} onToggleDark={toggleDark}
          notifPermission={notifPermission} onRequestNotif={requestPermission}
          alertHour={alertHour} onAlertHourChange={setAlertHour}
        />
      )}

      {/* ── Main content ─────── */}
      <div className="flex-1 lg:ml-[220px] min-h-[100dvh] flex flex-col pb-[calc(58px+env(safe-area-inset-bottom,0px))] lg:pb-0">

        {/* Mobile header */}
        <div className="lg:hidden">
          <Header view={view} lowStockCount={lowStockItems.length} user={user} onLogout={onLogout} dark={dark} onToggleDark={toggleDark} />
        </div>

        {/* Desktop page header */}
        <div className="hidden lg:flex items-center justify-between px-8 py-5 sticky top-0 z-10 bg-[#fafaf9]/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="font-sans font-bold text-lg text-gray-800 dark:text-gray-100">
              {VIEW_TITLES[view] ?? view}
            </h2>
            {view === 'inventory' && lowStockItems.length > 0 && !locationFilter && (
              <p className="font-sans text-xs text-peach-500 font-medium mt-0.5">
                {lowStockItems.length} {lowStockItems.length === 1 ? 'item needs' : 'items need'} restocking
              </p>
            )}
            {view === 'inventory' && activeLocationName && (
              <p className="font-sans text-xs text-blush-400 font-medium mt-0.5">
                📍 Filtered by: {activeLocationName}
              </p>
            )}
            {view === 'locations' && (
              <p className="font-sans text-xs text-gray-400 font-medium mt-0.5">
                {locations.length} {locations.length === 1 ? 'location' : 'locations'} · tap a card to filter inventory
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {view === 'shopping' && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans font-bold text-sm text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 border border-lavender-200 dark:border-lavender-500/20 hover:bg-lavender-100 transition-all"
              >
                🔗 Share
              </button>
            )}
            {view === 'inventory' && SORT_OPTS.map(({ key, label, title }) => (
              <button
                key={key} title={title} onClick={() => setSortBy(key)}
                className={`px-2.5 py-1.5 rounded-lg font-sans font-bold text-xs transition-all ${
                  sortBy === key ? 'bg-blush-100 dark:bg-blush-500/20 text-blush-500 shadow-sm' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'
                }`}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* PWA install banner */}
        {canInstall && (
          <div className="mx-4 mt-3 lg:mx-8">
            <div className="bg-gradient-to-r from-lavender-50 to-blush-50 dark:from-lavender-500/10 dark:to-blush-500/10 border border-lavender-200 dark:border-lavender-500/20 rounded-2xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">📱</span>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-sm text-lavender-500">Add to home screen</p>
                <p className="font-sans text-xs text-gray-400">Quick access without the browser</p>
              </div>
              <button onClick={install} className="flex-shrink-0 px-3 py-1.5 rounded-xl font-sans font-bold text-xs text-white bg-lavender-400 hover:bg-lavender-500 transition-all">Install</button>
              <button onClick={dismiss} aria-label="Dismiss install banner" className="flex-shrink-0 w-7 h-7 rounded-full bg-white/70 dark:bg-gray-700/70 flex items-center justify-center text-gray-400 text-xs">✕</button>
            </div>
          </div>
        )}

        {/* Bottom nav spacer — reserves space so content isn't hidden behind the fixed nav */}
        <div className="lg:hidden h-[env(safe-area-inset-bottom,0px)]" />

        {/* ── Dashboard ─── */}
        {view === 'dashboard' && (
          <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blush-100 border-t-blush-400 rounded-full animate-spin" /></div>}>
            <Dashboard
              items={items}
              categories={categories}
              lowStockItems={lowStockItems}
              expiringItems={expiringItems}
              overdueRecurItems={overdueRecurItems}
            />
          </Suspense>
        )}

        {/* ── Locations ─── */}
        {view === 'locations' && (
          <LocationsPage
            locations={locations}
            items={items}
            onAdd={addLocation}
            onDelete={deleteLocation}
            onReorder={reorderLocations}
            canManage={permissions.canManageLocations}
            onSelectLocation={handleSelectLocation}
          />
        )}

        {/* ── Expiry Calendar ─── */}
        {view === 'expiry' && (
          <Suspense fallback={<ViewSpinner />}>
            <ExpiryCalendar items={items} categories={categories} />
          </Suspense>
        )}

        {/* ── Wishlist ─── */}
        {view === 'wishlist' && (
          <Suspense fallback={<ViewSpinner />}>
            <WishlistPage
              items={wishlist.items}
              categories={categories}
              loading={wishlist.loading}
              onAdd={wishlist.addItem}
              onDelete={wishlist.deleteItem}
              onUpdatePriority={wishlist.updatePriority}
              onPromote={handlePromoteWishlist}
            />
          </Suspense>
        )}

        {/* ── Tasks ─── */}
        {view === 'tasks' && (
          <Suspense fallback={<ViewSpinner />}>
            <TasksPage user={user} showToast={showToast} />
          </Suspense>
        )}

        {/* ── Help ─── */}
        {view === 'help' && (
          <Suspense fallback={<ViewSpinner />}>
            <HelpPage />
          </Suspense>
        )}

        {/* ── Inventory ─── */}
        {view === 'inventory' && (
          <>
            <div className="px-4 lg:px-8 pt-3">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm pointer-events-none">🔍</span>
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search items, location, store…"
                  className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 font-sans text-sm focus:outline-none focus:border-blush-300 focus:ring-2 focus:ring-blush-100 transition-all placeholder-gray-300 dark:placeholder-gray-600 shadow-card dark:text-white"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">✕</button>
                )}
              </div>

              {/* Active filter chips */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {/* Location filter chip */}
                {activeLocationName && (
                  <button
                    onClick={clearLocationFilter}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-bold bg-blush-100 dark:bg-blush-500/20 text-blush-500 hover:bg-blush-200 transition-all"
                  >
                    📍 {activeLocationName} ✕
                  </button>
                )}
                {/* Quick filter: Low Stock */}
                <button
                  onClick={() => toggleFilter('low')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-bold transition-all ${
                    activeFilters.has('low')
                      ? 'bg-peach-400 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-peach-100 hover:text-peach-500'
                  }`}
                >
                  ⚠️ Low Stock
                </button>
                {/* Quick filter: Expiring */}
                {expiringItems.length > 0 && (
                  <button
                    onClick={() => toggleFilter('expiring')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-bold transition-all ${
                      activeFilters.has('expiring')
                        ? 'bg-amber-400 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-amber-100 hover:text-amber-500'
                    }`}
                  >
                    📅 Expiring Soon
                  </button>
                )}
              </div>
            </div>

            <CategoryBar
              categories={categories}
              selected={selectedCategory}
              onSelect={setSelectedCategory}
              onManage={() => setShowCategoryModal(true)}
              canManage={permissions.canManageCategories}
            />

            <main className="flex-1 px-4 lg:px-8 pb-4">
              {filteredItems.length === 0 && !searchQuery && !locationFilter && activeFilters.size === 0 ? (
                <EmptyState onAdd={permissions.canAdd ? handleOpenAdd : null} />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3 lg:hidden">
                    <p className="font-sans text-xs text-gray-400 font-semibold">
                      {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                      {lowStockItems.length > 0 && ` · ${lowStockItems.length} low`}
                    </p>
                    <div className="flex items-center gap-1">
                      {SORT_OPTS.map(({ key, label, title }) => (
                        <button
                          key={key} title={title} onClick={() => setSortBy(key)}
                          className={`px-2.5 py-1.5 rounded-lg font-sans font-bold text-xs transition-all ${
                            sortBy === key ? 'bg-blush-100 dark:bg-blush-500/20 text-blush-400 shadow-sm' : 'text-gray-300 dark:text-gray-600 hover:text-gray-500'
                          }`}
                        >{label}</button>
                      ))}
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center mb-4">
                    <p className="font-sans text-xs text-gray-400 font-semibold">
                      {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                      {lowStockItems.length > 0 && ` · ${lowStockItems.length} low`}
                      {expiringItems.length > 0 && ` · ${expiringItems.length} expiring`}
                    </p>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="font-sans text-gray-400 text-sm">
                        {activeLocationName ? `No items in ${activeLocationName}` : `No items match "${searchQuery}"`}
                      </p>
                      {activeLocationName && (
                        <button onClick={clearLocationFilter} className="mt-3 font-sans text-sm text-blush-400 underline">
                          Clear location filter
                        </button>
                      )}
                      {searchQuery && !activeLocationName && permissions.canAdd && (
                        <button
                          onClick={() => { setAddModalDefaultName(searchQuery); setShowAddModal(true) }}
                          className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all mx-auto"
                        >
                          + Add "{searchQuery}"
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                      {filteredItems.map(item => (
                        <ItemCard
                          key={item.id}
                          item={item}
                          category={categoryMap.get(item.categoryId)}
                          location={locationMap.get(item.locationId)}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onUpdateQty={handleUpdateQty}
                          onDuplicate={permissions.canEdit ? handleDuplicate : null}
                          canEdit={permissions.canEdit}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </main>
          </>
        )}

        {/* ── Shopping ─── */}
        {view === 'shopping' && (
          <div className="flex-1 pt-3">
            <div className="lg:hidden flex justify-end px-4 mb-3">
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans font-bold text-sm text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 border border-lavender-200 dark:border-lavender-500/20 hover:bg-lavender-100 transition-all"
              >
                🔗 Share List
              </button>
            </div>
            <ShoppingList
              items={lowStockItems}
              categories={categories}
              locations={locations}
              onUpdateQty={handleUpdateQty}
            />
          </div>
        )}
      </div>

      {/* ── Mobile FAB — sits above bottom nav ─── */}
      {view === 'inventory' && permissions.canAdd && (
        <button
          onClick={handleOpenAdd}
          className="lg:hidden fixed right-5 w-14 h-14 rounded-full bg-gradient-to-br from-blush-300 to-lavender-400 text-white text-2xl shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center z-40"
          style={{ bottom: 'calc(58px + env(safe-area-inset-bottom, 0px) + 12px)' }}
          aria-label="Add item"
        >+</button>
      )}

      {/* ── Mobile bottom navigation ─── */}
      <BottomNav
        view={view} onView={setView} isHelper={isHelper}
        lowStockCount={lowStockItems.length}
        expiringCount={expiringItems.length}
        wishlistCount={wishlist.items.length}
      />

      {/* ── Modals ─── */}
      {(showAddModal || editingItem) && permissions.canEdit && (
        <ItemModal
          item={editingItem}
          categories={categories}
          locations={locations}
          defaultCategoryId={showAddModal && !editingItem ? defaultCategoryId : null}
          defaultName={showAddModal && !editingItem ? addModalDefaultName : ''}
          onSave={handleSave}
          onDelete={handleDelete}
          onDuplicate={handleDuplicate}
          onClose={handleCloseModal}
          onManageLocations={permissions.canManageLocations ? () => setShowLocationModal(true) : null}
        />
      )}
      {showCategoryModal && permissions.canManageCategories && (
        <CategoryModal onAdd={addCategory} onClose={() => setShowCategoryModal(false)} />
      )}
      {showLocationModal && permissions.canManageLocations && (
        <LocationsManager
          locations={locations}
          onAdd={addLocation}
          onDelete={deleteLocation}
          onClose={() => setShowLocationModal(false)}
        />
      )}
      {showShareModal && (
        <Suspense fallback={null}>
          <ShareModal user={user} onClose={() => setShowShareModal(false)} />
        </Suspense>
      )}
      {showBulkImport && permissions.canAdd && (
        <Suspense fallback={null}>
          <BulkImport
            categories={categories}
            onImport={addItem}
            onClose={() => setShowBulkImport(false)}
          />
        </Suspense>
      )}

      {/* ── Toast ─── */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900/92 dark:bg-gray-700/95 text-white px-5 py-2.5 rounded-full text-sm font-sans font-semibold shadow-lg whitespace-nowrap animate-fade-in pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}
