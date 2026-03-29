import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function fromDB(row) {
  return {
    id:             row.id,
    name:           row.name,
    notes:          row.notes ?? '',
    categoryId:     row.category_id ?? null,
    priority:       row.priority ?? 'medium',
    estimatedPrice: row.estimated_price != null ? Number(row.estimated_price) : null,
    store:          row.store ?? '',
    link:           row.link ?? '',
    createdAt:      row.created_at,
  }
}

export function useWishlist(userId) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    load()

    const channel = supabase
      .channel('rt-wishlist')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist' }, load)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  async function load() {
    const { data } = await supabase
      .from('wishlist')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setItems(data.map(fromDB))
    setLoading(false)
  }

  async function addItem(item) {
    const tempId = `temp_${Date.now()}`
    setItems(prev => [{ id: tempId, ...item, createdAt: new Date().toISOString() }, ...prev])
    const { data } = await supabase
      .from('wishlist')
      .insert([{
        name:            item.name,
        notes:           item.notes || null,
        category_id:     item.categoryId || null,
        priority:        item.priority || 'medium',
        estimated_price: item.estimatedPrice ? Number(item.estimatedPrice) : null,
        store:           item.store || null,
        link:            item.link || null,
        user_id:         userId,
      }])
      .select()
      .single()
    setItems(prev => data
      ? prev.map(i => i.id === tempId ? fromDB(data) : i)
      : prev.filter(i => i.id !== tempId)
    )
  }

  async function deleteItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('wishlist').delete().eq('id', id)
  }

  async function updatePriority(id, priority) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, priority } : i))
    await supabase.from('wishlist').update({ priority }).eq('id', id)
  }

  return { items, loading, addItem, deleteItem, updatePriority }
}
