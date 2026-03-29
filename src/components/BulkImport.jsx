import React, { useState, useRef } from 'react'

const TEMPLATE = `name,category,qty,unit,restock_qty,full_qty,price,expiry_date,location,notes
Milk,Groceries,2,L,1,6,3.50,,Kitchen fridge,Whole milk
Shampoo,Bathroom,1,bottle,1,3,,,Bathroom cabinet,`

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  return lines.slice(1).map(line => {
    const values = []
    let inQ = false, cur = ''
    for (const ch of line + ',') {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { values.push(cur.trim()); cur = '' }
      else cur += ch
    }
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  }).filter(r => r['name']?.trim())
}

export default function BulkImport({ categories, onImport, onClose }) {
  const fileRef = useRef()
  const [rows,     setRows]     = useState(null)
  const [progress, setProgress] = useState(null)
  const [finished, setFinished] = useState(false)
  const [failed,   setFailed]   = useState([])

  function downloadTemplate() {
    const blob = new Blob(['\ufeff' + TEMPLATE], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setRows(parseCSV(ev.target.result))
    reader.readAsText(file)
  }

  async function doImport() {
    const errs = []
    const fallbackCatId = categories.find(c => c.id !== 'all')?.id ?? null
    setProgress({ done: 0, total: rows.length })

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const catMatch = categories.find(c =>
        c.id !== 'all' && c.name.toLowerCase() === (row.category ?? '').toLowerCase().trim()
      )
      const item = {
        name:       row.name.trim(),
        categoryId: catMatch?.id ?? fallbackCatId,
        qty:        parseInt(row.qty, 10)       || 0,
        unit:       row.unit?.trim()            || 'pcs',
        restockQty: parseInt(row.restock_qty, 10) || 1,
        fullQty:    parseInt(row.full_qty, 10)  || 0,
        price:      row.price      ? parseFloat(row.price)  : null,
        expiryDate: row.expiry_date?.trim()     || null,
        location:   row.location?.trim()        || null,
        notes:      row.notes?.trim()           || null,
        locationId: null,
        image:      null,
        recurDays:  null,
      }
      try { await onImport(item) }
      catch { errs.push(row.name) }
      setProgress({ done: i + 1, total: rows.length })
    }

    setFailed(errs)
    setFinished(true)
  }

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto shadow-modal animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-600" />
        </div>

        <div className="px-5 pb-6 pt-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-title text-2xl text-blush-400">Bulk Import 📥</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">✕</button>
          </div>

          {!rows && !finished && (
            <div className="space-y-4">
              <div className="bg-lavender-50 dark:bg-lavender-500/10 rounded-2xl p-4 border border-lavender-100 dark:border-lavender-500/20">
                <p className="font-sans font-bold text-sm text-lavender-600 dark:text-lavender-300 mb-1">Expected CSV columns</p>
                <p className="font-sans text-xs font-mono text-gray-500 dark:text-gray-400 leading-relaxed">
                  name, category, qty, unit, restock_qty, full_qty, price, expiry_date, location, notes
                </p>
                <p className="font-sans text-xs text-gray-400 mt-1.5">
                  Only <strong>name</strong> is required. Category must match an existing category name.
                </p>
              </div>
              <button onClick={downloadTemplate} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans font-bold text-sm text-mint-600 bg-mint-50 dark:bg-mint-500/10 border border-mint-200 dark:border-mint-500/20 hover:bg-mint-100 transition-all">
                ⬇️ Download Template
              </button>
              <button
                onClick={() => { fileRef.current.value = ''; fileRef.current.click() }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all"
              >
                📂 Choose CSV File
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
            </div>
          )}

          {rows && !finished && (
            <div className="space-y-4">
              <div className="bg-mint-50 dark:bg-mint-500/10 rounded-xl px-4 py-3 border border-mint-100 dark:border-mint-500/20">
                <p className="font-sans font-semibold text-sm text-mint-600 dark:text-mint-400">✓ {rows.length} items ready to import</p>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700">
                {rows.slice(0, 30).map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2">
                    <div className="min-w-0">
                      <span className="font-sans font-semibold text-sm text-gray-700 dark:text-gray-200">{row.name}</span>
                      {row.category && <span className="font-sans text-xs text-gray-400 ml-2">{row.category}</span>}
                    </div>
                    <span className="font-sans text-xs text-gray-400 flex-shrink-0 ml-2">{row.qty || 0} {row.unit || 'pcs'}</span>
                  </div>
                ))}
                {rows.length > 30 && (
                  <div className="px-3 py-2 text-center font-sans text-xs text-gray-400">+{rows.length - 30} more</div>
                )}
              </div>

              {progress && (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-sans text-xs text-gray-500 dark:text-gray-400">Importing…</span>
                    <span className="font-sans text-xs font-bold text-blush-400">{progress.done}/{progress.total}</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blush-300 to-lavender-400 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.round(progress.done / progress.total * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => { setRows(null); setProgress(null) }} className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 transition-all">
                  Change File
                </button>
                <button onClick={doImport} disabled={!!progress} className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all disabled:opacity-60">
                  {progress ? `${progress.done}/${progress.total}…` : `Import ${rows.length} Items`}
                </button>
              </div>
            </div>
          )}

          {finished && (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">🎉</div>
              <p className="font-sans font-bold text-lg text-gray-700 dark:text-gray-100">{rows.length - failed.length} items imported!</p>
              {failed.length > 0 && (
                <p className="font-sans text-xs text-red-400 mt-1">
                  {failed.length} failed: {failed.slice(0, 5).join(', ')}{failed.length > 5 ? '…' : ''}
                </p>
              )}
              <button onClick={onClose} className="mt-5 px-8 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow">
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
