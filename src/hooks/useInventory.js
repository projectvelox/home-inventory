import { useState, useEffect } from 'react'

const DEFAULT_CATEGORIES = [
  { id: 'all', name: 'All Items', emoji: '🏠', color: '#f9a8d4' },
  { id: 'groceries', name: 'Groceries', emoji: '🛒', color: '#86efac' },
  { id: 'baby', name: 'Baby Things', emoji: '🍼', color: '#bae6fd' },
  { id: 'cleaning', name: 'Cleaning', emoji: '🧹', color: '#d8b4fe' },
  { id: 'toiletries', name: 'Toiletries', emoji: '🧴', color: '#fdba74' },
  { id: 'snacks', name: 'Snacks', emoji: '🍪', color: '#fde68a' },
]

const STORAGE_KEY = 'home-inventory-data'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save', e)
  }
}

export function useInventory() {
  const stored = loadFromStorage()

  const [items, setItems] = useState(stored?.items ?? [])
  const [categories, setCategories] = useState(stored?.categories ?? DEFAULT_CATEGORIES)

  useEffect(() => {
    saveToStorage({ items, categories })
  }, [items, categories])

  function addItem(item) {
    const now = new Date().toISOString()
    const newItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    setItems(prev => [newItem, ...prev])
  }

  function updateItem(id, updates) {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i
      const now = new Date().toISOString()
      const newQty = updates.qty !== undefined ? Number(updates.qty) : i.qty
      const wasRestocked = updates.qty !== undefined && newQty > i.qty
      return {
        ...i,
        ...updates,
        updatedAt: now,
        ...(wasRestocked ? { lastRestocked: now } : {}),
      }
    }))
  }

  function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function addCategory(cat) {
    const newCat = { ...cat, id: crypto.randomUUID() }
    setCategories(prev => [...prev, newCat])
  }

  function deleteCategory(id) {
    setCategories(prev => prev.filter(c => c.id !== id))
    setItems(prev => prev.map(i => i.categoryId === id ? { ...i, categoryId: 'groceries' } : i))
  }

  const lowStockItems = items.filter(i => i.qty <= i.restockQty && i.restockQty > 0)

  return {
    items,
    categories,
    lowStockItems,
    addItem,
    updateItem,
    deleteItem,
    addCategory,
    deleteCategory,
  }
}
