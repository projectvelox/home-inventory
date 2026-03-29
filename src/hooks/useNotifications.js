import { useState, useCallback } from 'react'

export function useNotifications() {
  const [permission, setPermission] = useState(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
    return Notification.permission
  })

  // Preferred alert hour (0-23), stored in localStorage
  const [alertHour, setAlertHourState] = useState(() => {
    try { return parseInt(localStorage.getItem('notif-hour') ?? '8', 10) } catch { return 8 }
  })

  function setAlertHour(h) {
    const hour = Math.max(0, Math.min(23, parseInt(h, 10)))
    setAlertHourState(hour)
    try { localStorage.setItem('notif-hour', String(hour)) } catch {}
    // Reset today's notification key so it can fire again at the new hour
    try { localStorage.removeItem(`notified-${new Date().toISOString().split('T')[0]}`) } catch {}
  }

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return 'unsupported'
    const result = await Notification.requestPermission()
    setPermission(result)
    return result
  }, [])

  const notifyIfDue = useCallback((lowStockCount) => {
    if (permission !== 'granted' || lowStockCount === 0) return
    const now = new Date()
    // Only fire at or after the preferred hour
    if (now.getHours() < alertHour) return
    const today = now.toISOString().split('T')[0]
    const key = `notified-${today}`
    if (localStorage.getItem(key)) return
    localStorage.setItem(key, '1')
    try {
      new Notification('My Home Haven 🏠', {
        body: `${lowStockCount} item${lowStockCount === 1 ? '' : 's'} need restocking`,
        icon: '/favicon.svg',
        tag: 'low-stock',
      })
    } catch {}
  }, [permission, alertHour])

  return { permission, requestPermission, notifyIfDue, alertHour, setAlertHour }
}
