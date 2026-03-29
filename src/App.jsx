import React, { useState, useMemo } from 'react'
import Header from './components/Header'
import CategoryBar from './components/CategoryBar'
import ItemCard from './components/ItemCard'
import ItemModal from './components/ItemModal'
import CategoryModal from './components/CategoryModal'
import EmptyState from './components/EmptyState'
import ShoppingList from './components/ShoppingList'
import { useInventory } from './hooks/useInventory'
import { usePWAInstall } from './hooks/usePWAInstall'

export default function App() {
  const { items, categories, lowStockItems, addItem, updateItem, deleteItem, addCategory } = useInventory()
  const { canInstall, install, dismiss } = usePWAInstall()

  const [view, setView] = useState('inventory')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [editingItem, setEditingItem] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('low-stock')

  const filteredItems = useMemo(() => {
    let result = selectedCategory === 'all'
      ? items
      : items.filter(i => i.categoryId === selectedCategory)

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.notes?.toLowerCase().includes(q) ||
        i.location?.toLowerCase().includes(q)
      )
    }

    if (sortBy === 'a-z') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === 'recent') {
      result = [...result].sort((a, b) =>
        new Date(b.updatedAt ?? b.createdAt ?? 0) - new Date(a.updatedAt ?? a.createdAt ?? 0)
      )
    } else {
      // low-stock first
      result = [...result].sort((a, b) => {
        const aLow = a.qty <= a.restockQty && a.restockQty > 0 ? 0 : 1
        const bLow = b.qty <= b.restockQty && b.restockQty > 0 ? 0 : 1
        if (aLow !== bLow) return aLow - bLow
        return a.name.localeCompare(b.name)
      })
    }

    return result
  }, [items, selectedCategory, searchQuery, sortBy])

  function handleSave(itemData) {
    if (itemData.id) {
      updateItem(itemData.id, itemData)
    } else {
      addItem(itemData)
    }
    setEditingItem(null)
    setShowAddModal(false)
  }

  function handleDelete(id) {
    if (confirm('Remove this item?')) {
      deleteItem(id)
      setEditingItem(null)
    }
  }

  function getCategoryById(id) {
    return categories.find(c => c.id === id)
  }

  return (
    <div className="min-h-screen pb-24">
      <Header lowStockCount={lowStockItems.length} />

      {/* PWA install banner */}
      {canInstall && (
        <div className="max-w-2xl mx-auto px-4 pt-3">
          <div className="bg-gradient-to-r from-lavender-100 to-blush-100 border border-lavender-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <span className="text-2xl">📱</span>
            <div className="flex-1 min-w-0">
              <p className="font-cute font-bold text-sm text-lavender-500">Add to home screen!</p>
              <p className="font-cute text-xs text-gray-400">Quick access without opening the browser</p>
            </div>
            <button
              onClick={install}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl font-cute font-bold text-xs text-white bg-lavender-400 hover:bg-lavender-500 transition-all"
            >
              Install
            </button>
            <button
              onClick={dismiss}
              aria-label="Dismiss install banner"
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/70 flex items-center justify-center text-gray-400 hover:bg-white text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="flex gap-2 p-1 bg-white/60 rounded-2xl shadow-sm">
          <button
            onClick={() => setView('inventory')}
            className={`flex-1 py-2 rounded-xl font-cute font-bold text-sm transition-all ${view === 'inventory' ? 'bg-white shadow text-blush-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            🏠 Inventory
          </button>
          <button
            onClick={() => setView('shopping')}
            className={`flex-1 py-2 rounded-xl font-cute font-bold text-sm transition-all relative ${view === 'shopping' ? 'bg-white shadow text-peach-400' : 'text-gray-400 hover:text-gray-600'}`}
          >
            🛒 Shopping
            {lowStockItems.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-peach-400 text-white text-xs font-cute font-bold flex items-center justify-center">
                {lowStockItems.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'inventory' && (
        <>
          {/* Search bar */}
          <div className="max-w-2xl mx-auto px-4 pt-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search items, notes, location..."
                className="w-full pl-9 pr-8 py-2.5 rounded-2xl border-2 border-white/80 bg-white/70 font-cute text-sm focus:outline-none focus:border-lavender-300 focus:bg-white transition-all placeholder-gray-300"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <CategoryBar
            categories={categories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            onManage={() => setShowCategoryModal(true)}
          />

          <main className="max-w-2xl mx-auto px-4">
            {filteredItems.length === 0 && !searchQuery ? (
              <EmptyState onAdd={() => setShowAddModal(true)} />
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <p className="font-cute text-sm text-gray-400 font-semibold">
                    {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                    {lowStockItems.length > 0 && ` · ${lowStockItems.length} low`}
                  </p>
                  {/* Sort controls */}
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'low-stock', label: '⚠️', title: 'Low stock first' },
                      { key: 'a-z', label: 'A–Z', title: 'Alphabetical' },
                      { key: 'recent', label: '🕐', title: 'Recently updated' },
                    ].map(({ key, label, title }) => (
                      <button
                        key={key}
                        title={title}
                        onClick={() => setSortBy(key)}
                        className={`px-2 py-1 rounded-lg font-cute font-bold text-xs transition-all ${sortBy === key ? 'bg-blush-100 text-blush-400 shadow-sm' : 'text-gray-300 hover:text-gray-500'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredItems.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="font-cute text-gray-400 text-sm">No items match &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredItems.map(item => (
                      <ItemCard
                        key={item.id}
                        item={item}
                        category={getCategoryById(item.categoryId)}
                        onEdit={setEditingItem}
                        onDelete={handleDelete}
                        onUpdateQty={(id, qty) => updateItem(id, { qty })}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}

      {view === 'shopping' && (
        <div className="pt-4">
          <ShoppingList
            items={lowStockItems}
            categories={categories}
            onUpdateQty={(id, qty) => updateItem(id, { qty })}
          />
        </div>
      )}

      {/* FAB — inventory view only */}
      {view === 'inventory' && (
        <button
          onClick={() => setShowAddModal(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-blush-300 to-lavender-400 text-white text-2xl shadow-lg hover:shadow-xl hover:scale-110 transition-all flex items-center justify-center z-40"
          aria-label="Add item"
        >
          +
        </button>
      )}

      {/* Modals */}
      {(showAddModal || editingItem) && (
        <ItemModal
          item={editingItem}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => { setEditingItem(null); setShowAddModal(false) }}
        />
      )}
      {showCategoryModal && (
        <CategoryModal
          onAdd={addCategory}
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </div>
  )
}
