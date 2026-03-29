import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ALL_CATEGORY = { id: 'all', name: 'All Items', emoji: '🏠', color: '#f9a8d4' }

// DB row (snake_case) → app object (camelCase)
function fromDB(row) {
  return {
    id: row.id,
    name: row.name,
    categoryId: row.category_id,
    qty: row.qty,
    restockQty: row.restock_qty,
    fullQty: row.full_qty,
    unit: row.unit,
    notes: row.notes,
    location: row.location,
    image: row.image,
    lastRestocked: row.last_restocked,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// App object (camelCase) → DB columns (snake_case), only known writable fields
function toDB(item) {
  const fieldMap = {
    name:       ['name',        false],
    categoryId: ['category_id', false],
    qty:        ['qty',         true],
    restockQty: ['restock_qty', true],
    fullQty:    ['full_qty',    true],
    unit:       ['unit',        false],
    notes:      ['notes',       false],
    location:   ['location',    false],
    image:      ['image',       false],
  }
  const result = {}
  for (const [camel, [snake, isNum]] of Object.entries(fieldMap)) {
    if (item[camel] !== undefined) {
      const val = isNum ? Number(item[camel]) : item[camel]
      result[snake] = val === '' ? null : val
    }
  }
  return result
}

export function useInventory() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([ALL_CATEGORY])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([loadItems(), loadCategories()]).then(() => setLoading(false))

    // Real-time: items
    const itemChannel = supabase
      .channel('rt-items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' },
        ({ new: row }) => setItems(prev => [fromDB(row), ...prev])
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' },
        ({ new: row }) => setItems(prev => prev.map(i => i.id === row.id ? fromDB(row) : i))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' },
        ({ old: row }) => setItems(prev => prev.filter(i => i.id !== row.id))
      )
      .subscribe()

    // Real-time: categories
    const catChannel = supabase
      .channel('rt-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' },
        () => loadCategories()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(itemChannel)
      supabase.removeChannel(catChannel)
    }
  }, [])

  async function loadItems() {
    const { data } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setItems(data.map(fromDB))
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('created_at')
    if (data) setCategories([ALL_CATEGORY, ...data])
  }

  async function addItem(item) {
    await supabase.from('items').insert([toDB(item)])
    // real-time INSERT event updates state
  }

  async function updateItem(id, updates) {
    const now = new Date().toISOString()
    const existing = items.find(i => i.id === id)
    const dbUpdates = { ...toDB(updates), updated_at: now }

    // Track last_restocked when qty goes up
    if (updates.qty !== undefined && existing && Number(updates.qty) > existing.qty) {
      dbUpdates.last_restocked = now
    }

    await supabase.from('items').update(dbUpdates).eq('id', id)
    // real-time UPDATE event updates state
  }

  async function deleteItem(id) {
    await supabase.from('items').delete().eq('id', id)
  }

  async function addCategory(cat) {
    await supabase.from('categories').insert([{
      name: cat.name,
      emoji: cat.emoji,
      color: cat.color,
    }])
  }

  async function deleteCategory(id) {
    const fallback = categories.find(c => c.id !== 'all' && c.id !== id)
    if (fallback) {
      await supabase.from('items').update({ category_id: fallback.id }).eq('category_id', id)
    }
    await supabase.from('categories').delete().eq('id', id)
  }

  const lowStockItems = items.filter(i => i.qty <= i.restockQty && i.restockQty > 0)

  return {
    items, categories, lowStockItems, loading,
    addItem, updateItem, deleteItem, addCategory, deleteCategory,
  }
}
