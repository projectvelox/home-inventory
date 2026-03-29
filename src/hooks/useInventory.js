import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const ALL_CATEGORY = { id: 'all', name: 'All Items', emoji: '🏠', color: '#f9a8d4' }

function fromDB(row) {
  return {
    id:            row.id,
    name:          row.name,
    categoryId:    row.category_id,
    qty:           row.qty,
    restockQty:    row.restock_qty,
    fullQty:       row.full_qty,
    unit:          row.unit,
    notes:         row.notes,
    location:      row.location,
    locationId:    row.location_id ?? null,
    image:         row.image,
    expiryDate:    row.expiry_date ?? null,
    price:         row.price != null ? Number(row.price) : null,
    recurDays:     row.recur_days ?? null,
    lastRestocked: row.last_restocked,
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
    updatedBy:     row.updated_by ?? null,
    store:         row.store ?? null,
  }
}

function locationFromDB(row) {
  return { id: row.id, name: row.name, photo: row.photo ?? null, createdAt: row.created_at, sortOrder: row.sort_order ?? 0 }
}

function toDB(item) {
  const fieldMap = {
    name:       ['name',        false],
    categoryId: ['category_id', false],
    qty:        ['qty',         'int'],
    restockQty: ['restock_qty', 'int'],
    fullQty:    ['full_qty',    'int'],
    unit:       ['unit',        false],
    notes:      ['notes',       false],
    location:   ['location',    false],
    locationId: ['location_id', false],
    image:      ['image',       false],
    expiryDate: ['expiry_date', false],
    price:      ['price',       'float'],
    recurDays:  ['recur_days',  'int'],
    store:      ['store',       false],
  }
  const result = {}
  for (const [camel, [snake, numType]] of Object.entries(fieldMap)) {
    if (item[camel] === undefined) continue
    const raw = item[camel]
    if (raw === null || raw === '') {
      result[snake] = null
    } else if (numType === 'int') {
      const n = parseInt(raw, 10)
      result[snake] = isNaN(n) ? null : n
    } else if (numType === 'float') {
      const n = parseFloat(raw)
      result[snake] = isNaN(n) ? null : n
    } else {
      result[snake] = raw
    }
  }
  return result
}

export function useInventory(currentUserName) {
  const [items,      setItems]      = useState([])
  const [categories, setCategories] = useState([ALL_CATEGORY])
  const [locations,  setLocations]  = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    Promise.allSettled([loadItems(), loadCategories(), loadLocations()]).then(() => setLoading(false))

    const itemChannel = supabase
      .channel('rt-items')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' },
        ({ new: row }) => setItems(prev =>
          prev.some(i => i.id === row.id) ? prev : [fromDB(row), ...prev]
        )
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' },
        ({ new: row }) => setItems(prev => prev.map(i => {
          if (i.id !== row.id) return i
          const updated = fromDB(row)
          if (!updated.image && i.image) updated.image = i.image
          return updated
        }))
      )
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'items' },
        ({ old: row }) => setItems(prev => prev.filter(i => i.id !== row.id))
      )
      .subscribe()

    const catChannel = supabase
      .channel('rt-categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' },
        () => loadCategories()
      )
      .subscribe()

    const locChannel = supabase
      .channel('rt-locations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'locations' },
        () => loadLocations()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(itemChannel)
      supabase.removeChannel(catChannel)
      supabase.removeChannel(locChannel)
    }
  }, [])

  async function loadItems() {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    if (data) setItems(data.map(fromDB))
  }

  async function loadCategories() {
    const { data } = await supabase.from('categories').select('*').order('created_at')
    if (data) setCategories([ALL_CATEGORY, ...data])
  }

  async function loadLocations() {
    const { data } = await supabase.from('locations').select('*').order('sort_order').order('created_at')
    if (data) setLocations(data.map(locationFromDB))
  }

  async function addItem(item) {
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      id:            tempId,
      name:          item.name,
      categoryId:    item.categoryId,
      qty:           Number(item.qty),
      restockQty:    Number(item.restockQty),
      fullQty:       Number(item.fullQty) || 0,
      unit:          item.unit || 'pcs',
      notes:         item.notes || null,
      location:      item.location || null,
      locationId:    item.locationId ?? null,
      image:         item.image || null,
      expiryDate:    item.expiryDate || null,
      price:         item.price != null ? Number(item.price) : null,
      recurDays:     item.recurDays ? Number(item.recurDays) : null,
      lastRestocked: null,
      createdAt:     new Date().toISOString(),
      updatedAt:     new Date().toISOString(),
      updatedBy:     currentUserName ?? null,
    }
    setItems(prev => [optimistic, ...prev])
    const { data } = await supabase
      .from('items')
      .insert([{ ...toDB(item), updated_by: currentUserName ?? null }])
      .select()
      .single()
    setItems(prev => data
      ? prev.map(i => i.id === tempId ? fromDB(data) : i)
      : prev.filter(i => i.id !== tempId)
    )
  }

  async function updateItem(id, updates) {
    const now = new Date().toISOString()
    const existing = items.find(i => i.id === id)
    const dbUpdates = { ...toDB(updates), updated_at: now }

    if (updates.qty !== undefined && existing && Number(updates.qty) > existing.qty) {
      dbUpdates.last_restocked = now
      updates = { ...updates, lastRestocked: now }
    }

    dbUpdates.updated_by = currentUserName ?? null
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: now, updatedBy: currentUserName ?? null } : i))
    await supabase.from('items').update(dbUpdates).eq('id', id)
  }

  async function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('items').delete().eq('id', id)
  }

  async function duplicateItem(id) {
    const original = items.find(i => i.id === id)
    if (!original) return
    const { id: _id, createdAt: _c, updatedAt: _u, updatedBy: _ub, lastRestocked: _lr, ...rest } = original
    await addItem({ ...rest, name: `${original.name} (copy)`, expiryDate: null })
  }

  async function addCategory(cat) {
    await supabase.from('categories').insert([{ name: cat.name, emoji: cat.emoji, color: cat.color }])
  }

  async function deleteCategory(id) {
    const fallback = categories.find(c => c.id !== 'all' && c.id !== id)
    if (fallback) await supabase.from('items').update({ category_id: fallback.id }).eq('category_id', id)
    await supabase.from('categories').delete().eq('id', id)
  }

  async function addLocation(loc) {
    const tempId = `temp_${Date.now()}`
    setLocations(prev => [...prev, { id: tempId, name: loc.name, photo: loc.photo ?? null, createdAt: new Date().toISOString() }])
    const { data } = await supabase
      .from('locations')
      .insert([{ name: loc.name, photo: loc.photo ?? null }])
      .select()
      .single()
    setLocations(prev => data
      ? prev.map(l => l.id === tempId ? locationFromDB(data) : l)
      : prev.filter(l => l.id !== tempId)
    )
  }

  async function reorderLocations(orderedIds) {
    // Optimistically reorder in state
    setLocations(prev => {
      const map = Object.fromEntries(prev.map(l => [l.id, l]))
      return orderedIds.map((id, idx) => ({ ...map[id], sortOrder: idx })).filter(Boolean)
    })
    // Batch-update sort_order in DB
    await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from('locations').update({ sort_order: idx }).eq('id', id)
      )
    )
  }

  async function deleteLocation(id) {
    setLocations(prev => prev.filter(l => l.id !== id))
    setItems(prev => prev.map(i => i.locationId === id ? { ...i, locationId: null } : i))
    await supabase.from('items').update({ location_id: null }).eq('location_id', id)
    await supabase.from('locations').delete().eq('id', id)
  }

  // ── Derived lists ─────────────────────────────────────────────
  const lowStockItems = items.filter(i => i.qty <= i.restockQty && i.restockQty > 0)

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const in7days = new Date(today.getTime() + 7 * 86400000)
  const expiringItems = items.filter(i => {
    if (!i.expiryDate) return false
    const exp = new Date(i.expiryDate + 'T00:00:00')
    return exp <= in7days
  })

  const overdueRecurItems = items.filter(i => {
    if (!i.recurDays || !i.lastRestocked) return false
    const due = new Date(new Date(i.lastRestocked).getTime() + i.recurDays * 86400000)
    return due <= today
  })

  return {
    items, categories, locations, lowStockItems, expiringItems, overdueRecurItems, loading,
    addItem, updateItem, deleteItem, duplicateItem,
    addCategory, deleteCategory,
    addLocation, deleteLocation, reorderLocations,
  }
}
