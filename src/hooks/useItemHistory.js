import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useItemHistory(itemId) {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!itemId) return
    setLoading(true)
    supabase
      .from('item_history')
      .select('*')
      .eq('item_id', itemId)
      .order('changed_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setHistory(data ?? [])
        setLoading(false)
      })
  }, [itemId])

  return { history, loading }
}
