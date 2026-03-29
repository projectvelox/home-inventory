// Returns today's date as YYYY-MM-DD in the device's local timezone
// (avoids UTC date being off by one in UTC+8 Philippines timezone)
export function localToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Compresses an image File/Blob to a JPEG data URL at max 800px and 60% quality
// Keeps photos under ~150KB even from a phone camera
export function compressImage(file) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 800
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.6))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export const CATEGORY_META = {
  cleaning: { label: 'Cleaning',  labelFil: 'Paglilinis',  emoji: '🧹' },
  cooking:  { label: 'Cooking',   labelFil: 'Pagluluto',   emoji: '🍳' },
  laundry:  { label: 'Laundry',   labelFil: 'Labada',      emoji: '👕' },
  shopping: { label: 'Shopping',  labelFil: 'Pamimili',    emoji: '🛍️' },
  other:    { label: 'Other',     labelFil: 'Iba Pa',      emoji: '✅' },
}

export const RECUR_META = {
  none:    { label: 'One-time',      short: '',        emoji: '' },
  daily:   { label: 'Repeats daily', short: 'Daily',   emoji: '🔁' },
  weekly:  { label: 'Repeats weekly',short: 'Weekly',  emoji: '🔁' },
}

export const TEMPLATE_COLORS = [
  '#fda4af', '#c4b5fd', '#6ee7b7', '#fcd34d', '#93c5fd', '#f9a8d4',
]

export const TEMPLATE_EMOJIS = ['📋', '🧹', '🍳', '👕', '🛍️', '🏠', '✨', '🌿', '🫧', '🧺']
