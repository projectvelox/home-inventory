import React, { useState, useRef, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import { localToday, compressImage, CATEGORY_META, RECUR_META, TEMPLATE_COLORS, TEMPLATE_EMOJIS } from '../lib/taskUtils'

// ─── Shared helpers ───────────────────────────────────────────
function catMeta(cat) { return CATEGORY_META[cat] ?? CATEGORY_META.other }

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round(done / total * 100)
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-sans text-xs text-gray-500 dark:text-gray-400 font-medium">{done} of {total} done</span>
        <span className="font-sans text-xs font-bold text-blush-400">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blush-300 to-lavender-400 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Task Card ────────────────────────────────────────────────
function TaskCard({ task, onTap, onDelete, canDelete, assigneeName, onQuickDone }) {
  const meta     = catMeta(task.category)
  const isDone   = task.status === 'done'
  const doneTime = task.completedAt
    ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className={`group bg-white dark:bg-gray-800 rounded-2xl shadow-card p-3.5 flex items-center gap-3 transition-all ${isDone ? 'opacity-55' : 'hover:shadow-card-md'}`}>

      {/* Quick-done circle (helper) or category emoji (admin/done) */}
      {onQuickDone && !isDone ? (
        <button
          onClick={e => { e.stopPropagation(); onQuickDone(task.id) }}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-300 hover:border-mint-400 hover:text-mint-400 hover:bg-mint-50 dark:hover:bg-mint-500/10 transition-all active:scale-95"
          title="Mark done"
          aria-label="Mark done"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      ) : (
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isDone ? 'bg-mint-50 dark:bg-mint-500/10' : 'bg-blush-50 dark:bg-blush-500/10'}`}>
          {isDone ? '✅' : meta.emoji}
        </div>
      )}

      {/* Content — tappable area */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onTap(task)}>
        <p className={`font-sans font-semibold text-sm text-gray-700 dark:text-gray-100 leading-snug ${isDone ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {assigneeName && (
            <span className="font-sans text-[10px] font-semibold text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 px-1.5 py-0.5 rounded-full">{assigneeName}</span>
          )}
          {task.recurType && task.recurType !== 'none' && (
            <span className="font-sans text-[10px] font-semibold text-sky-500 bg-sky-50 dark:bg-sky-500/10 px-1.5 py-0.5 rounded-full">
              🔁 {RECUR_META[task.recurType]?.short ?? task.recurType}
            </span>
          )}
          {task.estimatedMins && !isDone && (
            <span className="font-sans text-[10px] text-gray-400">⏱ {task.estimatedMins}m</span>
          )}
          {isDone && doneTime && (
            <span className="font-sans text-[10px] text-mint-500 font-medium">✓ {doneTime}</span>
          )}
          {task.description && !isDone && (
            <span className="font-sans text-[10px] text-gray-400 truncate max-w-[140px]">{task.description}</span>
          )}
        </div>
      </div>

      {/* Completion photo thumbnail */}
      {isDone && task.completedPhoto && (
        <img
          src={task.completedPhoto}
          alt="proof"
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0 cursor-pointer ring-2 ring-white dark:ring-gray-700"
          onClick={() => onTap(task)}
        />
      )}

      {/* Delete — always visible at low opacity on mobile, full on hover/focus */}
      {canDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(task.id) }}
          className="flex-shrink-0 w-9 h-9 rounded-full bg-red-50 dark:bg-red-500/10 text-red-300 dark:text-red-500/60 flex items-center justify-center hover:bg-red-100 hover:text-red-400 transition-all opacity-40 group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete task"
        >✕</button>
      )}
    </div>
  )
}

// ─── Task Completion Sheet (helper uses this) ─────────────────
function CompletionSheet({ task, onDone, onClose }) {
  const [photo,       setPhoto]       = useState(null)
  const [notes,       setNotes]       = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showExtras,  setShowExtras]  = useState(false)
  const cameraRef  = useRef()
  const galleryRef = useRef()

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const compressed = await compressImage(file)
    setPhoto(compressed)
    e.target.value = ''
  }

  async function handleSubmit() {
    setLoading(true)
    await onDone(task.id, { photo: photo || null, notes: notes.trim() || null })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />

        {/* Task info */}
        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-blush-50 dark:bg-blush-500/10 flex items-center justify-center text-xl flex-shrink-0">
            {catMeta(task.category).emoji}
          </div>
          <div className="flex-1">
            <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100 leading-snug">{task.title}</h3>
            {task.description && (
              <p className="font-sans text-sm text-gray-500 dark:text-gray-400 mt-0.5">{task.description}</p>
            )}
          </div>
        </div>

        {/* PRIMARY action — always visible and prominent */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-sans font-bold text-base text-white bg-gradient-to-r from-mint-400 to-mint-500 shadow-md hover:shadow-lg transition-all disabled:opacity-50 mb-3"
        >
          {loading ? 'Saving…' : '✓ Mark as Done'}
        </button>

        {/* Collapsible extras: photo + notes */}
        <button
          onClick={() => setShowExtras(v => !v)}
          className="w-full py-2.5 rounded-xl font-sans font-semibold text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center gap-2 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 mb-1"
        >
          📷 Add photo or note <span className="text-gray-400">{showExtras ? '▲' : '▼'}</span>
        </button>

        {showExtras && (
          <div className="mt-3 space-y-3">
            {photo ? (
              <div className="relative rounded-2xl overflow-hidden">
                <img src={photo} alt="completion" className="w-full max-h-52 object-cover rounded-2xl" />
                <button
                  onClick={() => setPhoto(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full text-white text-sm flex items-center justify-center"
                >✕</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => cameraRef.current?.click()}
                  className="flex-1 py-3 rounded-xl font-sans font-semibold text-sm text-blush-400 bg-blush-50 dark:bg-blush-500/10 border-2 border-blush-100 dark:border-blush-500/20 hover:bg-blush-100 transition-all"
                >📷 Camera</button>
                <button onClick={() => galleryRef.current?.click()}
                  className="flex-1 py-3 rounded-xl font-sans font-semibold text-sm text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 border-2 border-lavender-100 dark:border-lavender-500/20 hover:bg-lavender-100 transition-all"
                >🖼️ Gallery</button>
              </div>
            )}
            <input ref={cameraRef}  type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} aria-label="Take photo" />
            <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={handleFile} aria-label="Choose from gallery" />
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2.5 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blush-200 resize-none"
            />
            {/* Re-show submit with photo/notes attached */}
            {(photo || notes.trim()) && (
              <button onClick={handleSubmit} disabled={loading}
                className="w-full py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-mint-400 to-mint-500 shadow disabled:opacity-50"
              >{loading ? 'Saving…' : '✓ Done with photo/note'}</button>
            )}
          </div>
        )}

        <button onClick={onClose} className="w-full py-3 mt-2 rounded-xl font-sans font-semibold text-sm text-gray-400 dark:text-gray-500">
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── Task Detail Sheet (admin views completion) ───────────────
function TaskDetailSheet({ task, onClose, onReopen, onDelete, onEdit, onComplete, isHelper, readOnly, assigneeName, showToast }) {
  const meta = catMeta(task.category)
  const isDone = task.status === 'done'
  const dueDateDisplay = task.dueDate
    ? new Date(task.dueDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    : null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[85dvh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blush-50 dark:bg-blush-500/10 flex items-center justify-center text-xl flex-shrink-0">
            {isDone ? '✅' : meta.emoji}
          </div>
          <div className="flex-1">
            <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100">{task.title}</h3>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold text-white" style={{ backgroundColor: '#fda4af' }}>{meta.label}</span>
              {dueDateDisplay && <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500 font-semibold">📅 {dueDateDisplay}</span>}
              {assigneeName && <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-lavender-50 dark:bg-lavender-500/10 text-lavender-500 font-semibold">👤 {assigneeName}</span>}
              {task.estimatedMins && <span className="px-2 py-0.5 rounded-full text-[10px] font-sans bg-gray-100 dark:bg-gray-700 text-gray-500">⏱ {task.estimatedMins} min</span>}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold ${isDone ? 'bg-mint-50 dark:bg-mint-500/10 text-mint-600' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'}`}>
                {isDone ? 'Done' : 'Pending'}
              </span>
            </div>
          </div>
        </div>

        {task.description && (
          <p className="font-sans text-sm text-gray-500 dark:text-gray-400 mb-3">{task.description}</p>
        )}

        {isDone && task.completedPhoto && (
          <div className="mb-3 rounded-2xl overflow-hidden">
            <img src={task.completedPhoto} alt="completion" className="w-full max-h-64 object-cover" />
          </div>
        )}
        {isDone && task.completionNotes && (
          <div className="bg-mint-50 dark:bg-mint-500/10 rounded-xl px-3 py-2.5 mb-3">
            <p className="font-sans text-xs text-mint-600 dark:text-mint-400 font-semibold mb-0.5">Note</p>
            <p className="font-sans text-sm text-gray-700 dark:text-gray-200">{task.completionNotes}</p>
          </div>
        )}
        {isDone && task.completedAt && (
          <p className="font-sans text-xs text-gray-400 mb-4">
            Completed {new Date(task.completedAt).toLocaleString()}
          </p>
        )}

        <div className="flex gap-2 flex-wrap">
          {!isHelper && !readOnly && !isDone && onComplete && (
            <button
              onClick={async () => { await onComplete(task.id, {}); showToast?.('Task marked as done'); onClose() }}
              className="flex-1 py-2.5 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-mint-400 to-mint-500 shadow hover:shadow-md transition-all"
            >✓ Mark Done</button>
          )}
          {!isHelper && !readOnly && !isDone && onEdit && (
            <button
              onClick={() => { onClose(); onEdit(task) }}
              className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 hover:bg-lavender-100 transition-all"
            >✏️ Edit</button>
          )}
          {!isHelper && !readOnly && isDone && (
            <button
              onClick={() => { onReopen(task.id); showToast?.('Task reopened'); onClose() }}
              className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 transition-all"
            >↩ Reopen</button>
          )}
          {!isHelper && !readOnly && (
            <button
              onClick={() => { if (confirm('Delete this task?')) { onDelete(task.id); onClose() } }}
              className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all"
            >🗑 Delete</button>
          )}
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl font-sans font-bold text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 transition-all">Close</button>
        </div>
      </div>
    </div>
  )
}

// ─── Create / Edit Task Sheet ─────────────────────────────────
function CreateTaskSheet({ helperProfiles, existing, onSave, onClose }) {
  const isEditing = !!(existing?.id)  // only true when editing a real task (has id)
  const [form, setForm] = useState({
    title:         existing?.title                         ?? '',
    description:   existing?.description                   ?? '',
    category:      existing?.category                      ?? 'cleaning',
    assignedTo:    existing?.assignedTo ?? helperProfiles[0]?.id ?? '',
    dueDate:       existing?.dueDate                       ?? localToday(),
    estimatedMins: existing?.estimatedMins != null ? String(existing.estimatedMins) : '',
    recurType:     existing?.recurType                     ?? 'none',
  })
  const [saving,    setSaving]    = useState(false)
  const [titleErr,  setTitleErr]  = useState(false)
  const [saveErr,   setSaveErr]   = useState(null)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) { setTitleErr(true); return }
    setTitleErr(false)
    setSaveErr(null)
    const payload = { ...form, title: form.title.trim(), estimatedMins: form.estimatedMins ? parseInt(form.estimatedMins) : null }
    if (isEditing) {
      setSaving(true)
      const result = await onSave(payload)
      setSaving(false)
      if (result?.error) { setSaveErr('Save failed — check your connection and try again.'); return }
    } else {
      onSave(payload) // fire-and-forget for create (optimistic UI handles it)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
        <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100 mb-4">{isEditing ? 'Edit Task' : 'New Task'}</h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text" value={form.title} onChange={e => { set('title', e.target.value); setTitleErr(false) }}
            placeholder="Task title *" autoFocus
            className={`w-full rounded-xl border-2 px-3 py-2.5 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none transition-colors ${titleErr ? 'border-red-300 focus:border-red-400 bg-red-50 dark:bg-red-500/5' : 'border-gray-100 dark:border-gray-700 focus:border-blush-200'}`}
          />
          {titleErr && <p className="font-sans text-xs text-red-500 -mt-1">Task title is required.</p>}
          <textarea
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Description (optional)" rows={2}
            className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2.5 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blush-200 resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Category</label>
              <select
                value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none"
              >
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Est. time (min)</label>
              <input
                type="number" min="1" max="480" value={form.estimatedMins} onChange={e => set('estimatedMins', e.target.value)}
                placeholder="e.g. 30"
                className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {helperProfiles.length > 0 && (
              <div>
                <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Assign to</label>
                <select
                  value={form.assignedTo} onChange={e => set('assignedTo', e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none"
                >
                  <option value="">— Unassigned —</option>
                  {helperProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.avatar} {p.displayName}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1">Due date</label>
              <input
                type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none"
              />
            </div>
          </div>
          {/* Recurrence */}
          <div>
            <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Recurrence</label>
            <div className="flex gap-2">
              {Object.entries(RECUR_META).map(([key, meta]) => (
                <button
                  key={key} type="button"
                  onClick={() => set('recurType', key)}
                  className={`flex-1 py-2 rounded-xl font-sans font-semibold text-xs border-2 transition-all ${
                    form.recurType === key
                      ? 'border-sky-300 bg-sky-50 dark:bg-sky-500/10 text-sky-500'
                      : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {meta.emoji ? `${meta.emoji} ` : ''}{key === 'none' ? 'One-time' : meta.short}
                </button>
              ))}
            </div>
          </div>

          {saveErr && (
            <p className="font-sans text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{saveErr}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-xl font-sans font-bold text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow disabled:opacity-60">
              {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Create Template Sheet ────────────────────────────────────
function CreateTemplateSheet({ existing, onSave, onClose }) {
  const [form,    setForm]    = useState({
    name:        existing?.name        ?? '',
    description: existing?.description ?? '',
    color:       existing?.color       ?? TEMPLATE_COLORS[0],
    emoji:       existing?.emoji       ?? TEMPLATE_EMOJIS[0],
    recurType:   existing?.recurType   ?? 'none',
  })
  const [items,   setItems]   = useState(
    existing?.items ?? [{ title: '', category: 'cleaning', estimatedMins: '' }]
  )
  const [saving,  setSaving]  = useState(false)
  const [errMsg,  setErrMsg]  = useState(null)
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  function addItem() { setItems(prev => [...prev, { title: '', category: 'cleaning', estimatedMins: '' }]) }
  function removeItem(i) { setItems(prev => prev.filter((_, idx) => idx !== i)) }
  function updateItem(i, k, v) { setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item)) }

  async function handleSubmit(e) {
    e.preventDefault()
    const validItems = items.filter(i => i.title.trim())
    if (!form.name.trim()) { setErrMsg('Template name is required.'); return }
    if (validItems.length === 0) { setErrMsg('Add at least one task step.'); return }
    setErrMsg(null)
    setSaving(true)
    const result = await onSave(form, validItems.map(i => ({ ...i, estimatedMins: i.estimatedMins ? parseInt(i.estimatedMins) : null })))
    setSaving(false)
    if (result?.error) {
      setErrMsg('Save failed — check your connection and try again.')
      return
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[90dvh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
        <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100 mb-4">
          {existing ? 'Edit Template' : 'New Template'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <input
            type="text" value={form.name} onChange={e => setF('name', e.target.value)}
            placeholder="Template name *" autoFocus required
            className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2.5 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blush-200"
          />

          {/* Emoji + Color */}
          <div>
            <p className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Icon</p>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setF('emoji', e)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center transition-all ${form.emoji === e ? 'ring-2 ring-blush-300 bg-blush-50 dark:bg-blush-500/10' : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100'}`}
                >{e}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Color</p>
            <div className="flex gap-2">
              {TEMPLATE_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setF('color', c)}
                  className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Recurrence */}
          <div>
            <p className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Recurrence</p>
            <div className="flex gap-2">
              {Object.entries(RECUR_META).map(([key, meta]) => (
                <button
                  key={key} type="button"
                  onClick={() => setF('recurType', key)}
                  className={`flex-1 py-2 rounded-xl font-sans font-semibold text-xs border-2 transition-all ${
                    form.recurType === key
                      ? 'border-sky-300 bg-sky-50 dark:bg-sky-500/10 text-sky-500'
                      : 'border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200'
                  }`}
                >
                  {meta.emoji ? `${meta.emoji} ` : ''}{key === 'none' ? 'One-time' : meta.short}
                </button>
              ))}
            </div>
          </div>

          {/* Task items */}
          <div>
            <p className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Task Steps</p>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="font-sans text-xs font-bold text-gray-300 w-5 text-center">{idx + 1}</span>
                  <input
                    type="text" value={item.title} onChange={e => updateItem(idx, 'title', e.target.value)}
                    placeholder="Task name"
                    className="flex-1 rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blush-200"
                  />
                  <select
                    value={item.category} onChange={e => updateItem(idx, 'category', e.target.value)}
                    className="rounded-xl border-2 border-gray-100 dark:border-gray-700 px-2 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none w-20"
                  >
                    {Object.entries(CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>{v.emoji}</option>
                    ))}
                  </select>
                  <input
                    type="number" min="1" max="480" value={item.estimatedMins} onChange={e => updateItem(idx, 'estimatedMins', e.target.value)}
                    placeholder="min" title="Estimated minutes"
                    className="w-16 rounded-xl border-2 border-gray-100 dark:border-gray-700 px-2 py-2 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="w-7 h-7 rounded-full bg-red-50 dark:bg-red-500/10 text-red-400 text-xs flex items-center justify-center hover:bg-red-100 flex-shrink-0">✕</button>
                  )}
                </div>
              ))}
              <button
                type="button" onClick={addItem}
                className="w-full py-2 rounded-xl font-sans font-semibold text-sm text-blush-400 border-2 border-dashed border-blush-200 dark:border-blush-500/30 hover:bg-blush-50 dark:hover:bg-blush-500/10 transition-all"
              >+ Add step</button>
            </div>
          </div>

          {errMsg && (
            <p className="font-sans text-xs text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-3 py-2">{errMsg}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} disabled={saving} className="flex-1 py-3 rounded-xl font-sans font-bold text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow disabled:opacity-60">
              {saving ? 'Saving…' : existing ? 'Save Changes' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Helper: task list for a date range ───────────────────────
function HelperTaskList({ tasks, today, onComplete }) {
  const [selectedTask, setSelectedTask] = useState(null)

  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      if (!map.has(t.dueDate)) map.set(t.dueDate, [])
      map.get(t.dueDate).push(t)
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-3">🎉</div>
        <p className="font-sans font-semibold text-gray-500 dark:text-gray-400">No tasks here</p>
        <p className="font-sans text-sm text-gray-400 mt-1">Enjoy your free time!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(([date, dayTasks]) => {
        const isToday = date === today
        const isPast  = date < today
        const label   = isToday
          ? 'Today'
          : new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
        const pending = dayTasks.filter(t => t.status === 'pending')
        const done    = dayTasks.filter(t => t.status === 'done')

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center gap-2 mb-2 px-1">
              <p className={`font-sans text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blush-400' : isPast ? 'text-gray-400' : 'text-lavender-400'}`}>{label}</p>
              <span className={`font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full ${done.length === dayTasks.length && dayTasks.length > 0 ? 'bg-mint-50 dark:bg-mint-500/10 text-mint-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                {done.length}/{dayTasks.length}
              </span>
            </div>

            {/* Progress bar for today */}
            {isToday && dayTasks.length > 0 && (
              <div className="mb-3"><ProgressBar done={done.length} total={dayTasks.length} /></div>
            )}

            {/* Pending tasks — quick-done button enabled */}
            {pending.length > 0 && (
              <div className="space-y-2 mb-2">
                {pending.map(task => (
                  <TaskCard
                    key={task.id} task={task}
                    onTap={setSelectedTask}
                    onDelete={() => {}} canDelete={false}
                    onQuickDone={id => onComplete(id, {})}
                  />
                ))}
              </div>
            )}

            {/* Divider between pending and done */}
            {pending.length > 0 && done.length > 0 && (
              <div className="flex items-center gap-2 my-2 px-1">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                <span className="font-sans text-[10px] text-mint-500 font-semibold uppercase tracking-wide">Completed</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
              </div>
            )}

            {/* Done tasks — no quick-done */}
            {done.length > 0 && (
              <div className="space-y-2">
                {done.map(task => (
                  <TaskCard key={task.id} task={task} onTap={setSelectedTask} onDelete={() => {}} canDelete={false} />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {selectedTask && (
        selectedTask.status === 'done'
          ? <TaskDetailSheet task={selectedTask} onClose={() => setSelectedTask(null)} onReopen={() => {}} onDelete={() => {}} isHelper />
          : <CompletionSheet task={selectedTask} onDone={onComplete} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  )
}

// ─── Helper View ──────────────────────────────────────────────
function HelperView({ user, tasks, onComplete }) {
  const [tab, setTab] = useState('today')
  const today = localToday()

  const hour = new Date().getHours()
  const name = user.displayName ?? user.display_name ?? 'Ate Lea'
  const emoji = hour < 12 ? '☀️' : hour < 17 ? '🌤️' : '🌙'

  const weekRange = useMemo(() => {
    const now = new Date(), day = now.getDay()
    const mon = new Date(now); mon.setDate(now.getDate() + (day === 0 ? -6 : 1 - day)); mon.setHours(0,0,0,0)
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6)
    return [mon.toISOString().slice(0,10), sun.toISOString().slice(0,10)]
  }, [])

  const monthRange = useMemo(() => {
    const now = new Date()
    return [
      new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10),
      new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10),
    ]
  }, [])

  const todayTasks  = tasks.filter(t => t.dueDate === today)
  const weekTasks   = tasks.filter(t => t.dueDate >= weekRange[0] && t.dueDate <= weekRange[1])
  const monthTasks  = tasks.filter(t => t.dueDate >= monthRange[0] && t.dueDate <= monthRange[1])
  const todayPending = todayTasks.filter(t => t.status === 'pending').length
  const todayDone    = todayTasks.filter(t => t.status === 'done').length
  const todayEstMins = todayTasks
    .filter(t => t.status === 'pending' && t.estimatedMins)
    .reduce((sum, t) => sum + t.estimatedMins, 0)
  const weekDone     = weekTasks.filter(t => t.status === 'done').length
  const monthDone    = monthTasks.filter(t => t.status === 'done').length

  const TABS = [
    { id: 'today', label: todayTasks.length > 0 ? `Today · ${todayDone}/${todayTasks.length}` : 'Today' },
    { id: 'week',  label: weekTasks.length > 0 ? `Week · ${weekDone}/${weekTasks.length}` : 'Week' },
    { id: 'month', label: monthTasks.length > 0 ? `Month · ${monthDone}/${monthTasks.length}` : 'Month' },
  ]

  const visibleTasks = tab === 'today' ? todayTasks : tab === 'week' ? weekTasks : monthTasks

  const allDoneToday = todayTasks.length > 0 && todayPending === 0

  return (
    <div className="max-w-lg mx-auto px-4 pb-10 pt-3 animate-fade-in">

      {/* Greeting strip — celebration mode when all done */}
      {allDoneToday ? (
        <div className="bg-gradient-to-r from-mint-50 to-lavender-50 dark:from-mint-500/10 dark:to-lavender-500/10 rounded-2xl px-4 py-4 mb-4 text-center">
          <p className="text-3xl mb-1">🎉</p>
          <p className="font-title text-lg text-mint-500 leading-tight">All done, {name}!</p>
          <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            You finished all {todayTasks.length} task{todayTasks.length !== 1 ? 's' : ''} today. Amazing work!
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between bg-gradient-to-r from-blush-50 to-lavender-50 dark:from-blush-500/10 dark:to-lavender-500/10 rounded-2xl px-4 py-3 mb-4">
          <div>
            <p className="font-title text-lg text-blush-400 leading-tight">{emoji} {name}</p>
            <p className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {todayTasks.length === 0
                ? 'No tasks today — enjoy!'
                : `${todayPending} task${todayPending !== 1 ? 's' : ''} left${todayEstMins > 0 ? ` · ~${todayEstMins < 60 ? `${todayEstMins}m` : `${Math.round(todayEstMins / 60 * 10) / 10}h`}` : ''}`}
            </p>
          </div>
          {todayTasks.length > 0 && (
            <div className="text-right">
              <p className="font-sans text-2xl font-bold text-blush-400 leading-none">{todayDone}</p>
              <p className="font-sans text-[10px] text-gray-400">of {todayTasks.length} done</p>
            </div>
          )}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-card mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-xl font-sans font-bold text-xs transition-all ${
              tab === t.id
                ? 'bg-gradient-to-r from-blush-50 to-lavender-50 dark:from-blush-500/10 dark:to-lavender-500/10 text-blush-500 shadow-sm'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >{t.label}</button>
        ))}
      </div>

      <HelperTaskList tasks={visibleTasks} today={today} onComplete={onComplete} />
    </div>
  )
}

// ─── Manager: Schedule Tab ────────────────────────────────────
function ScheduleTab({ tasks, helperProfiles, onCreateTask, onUpdateTask, onComplete, onReopen, onDelete, showToast }) {
  const [selected,      setSelected]      = useState(null)
  const [editingTask,   setEditingTask]   = useState(null)
  const [createDate,    setCreateDate]    = useState(null)
  const [filterHelper,  setFilterHelper]  = useState('all') // 'all' | helper id

  const today    = localToday()
  const tomorrow = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10)
  }, [])

  // Build id→displayName lookup for assignee chips
  const assigneeMap = useMemo(() => {
    const m = {}
    for (const p of helperProfiles) m[p.id] = p.displayName
    return m
  }, [helperProfiles])

  // Filter tasks by selected helper
  const filteredTasks = useMemo(() =>
    filterHelper === 'all' ? tasks : tasks.filter(t => t.assignedTo === filterHelper),
  [tasks, filterHelper])

  function dateLabel(date) {
    if (date === today)    return 'Today'
    if (date === tomorrow) return 'Tomorrow'
    return new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Overdue: pending tasks from before today
  const overdueTasks = useMemo(() =>
    filteredTasks.filter(t => t.dueDate < today && t.status === 'pending')
         .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  [filteredTasks, today])

  // All tasks today + future, grouped by date ascending
  const grouped = useMemo(() => {
    const map = new Map()
    // Always include today even if empty
    map.set(today, [])
    for (const t of filteredTasks) {
      if (t.dueDate >= today) {
        if (!map.has(t.dueDate)) map.set(t.dueDate, [])
        map.get(t.dueDate).push(t)
      }
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [filteredTasks, today])

  return (
    <div className="space-y-6">

      {/* Helper filter pills — sticky at top while scrolling */}
      {helperProfiles.length > 0 && (
        <div className="sticky top-0 z-10 -mx-4 px-4 py-2 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-sm -mb-2">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterHelper('all')}
              className={`px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all ${filterHelper === 'all' ? 'bg-blush-400 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 shadow-sm'}`}
            >All</button>
            {helperProfiles.map(p => (
              <button
                key={p.id}
                onClick={() => setFilterHelper(p.id)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-sans text-xs font-bold transition-all ${filterHelper === p.id ? 'bg-lavender-400 text-white shadow-sm' : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 shadow-sm'}`}
              ><span>{p.avatar}</span>{p.displayName}</button>
            ))}
          </div>
        </div>
      )}

      {/* Overdue section */}
      {overdueTasks.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="font-sans text-xs font-bold uppercase tracking-wide text-red-400">Overdue</p>
            <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 dark:bg-red-500/10 text-red-400">
              {overdueTasks.length}
            </span>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(t => (
              <div key={t.id} className="relative">
                <TaskCard
                  task={t} onTap={setSelected} onDelete={onDelete} canDelete
                  assigneeName={t.assignedTo ? assigneeMap[t.assignedTo] : null}
                />
                <span className="absolute -top-1 -left-1 font-sans text-[9px] font-bold text-red-400 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full border border-red-100 dark:border-red-500/20">
                  {new Date(t.dueDate + 'T12:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {grouped.map(([date, dayTasks]) => {
        const isToday  = date === today
        const pending  = dayTasks.filter(t => t.status === 'pending')
        const done     = dayTasks.filter(t => t.status === 'done')
        const label    = dateLabel(date)

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <p className={`font-sans text-xs font-bold uppercase tracking-wide ${isToday ? 'text-blush-400' : 'text-lavender-400'}`}>{label}</p>
                {dayTasks.length > 0 && (
                  <span className={`font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full ${done.length === dayTasks.length && dayTasks.length > 0 ? 'bg-mint-50 dark:bg-mint-500/10 text-mint-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                    {done.length}/{dayTasks.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setCreateDate(date)}
                className="text-xs font-sans font-bold text-blush-400 bg-blush-50 dark:bg-blush-500/10 px-2.5 py-1 rounded-lg hover:bg-blush-100 transition-all"
              >+ Add</button>
            </div>

            {/* Progress bar for today */}
            {isToday && dayTasks.length > 0 && (
              <div className="mb-3">
                <ProgressBar done={done.length} total={dayTasks.length} />
              </div>
            )}

            {/* Empty today */}
            {isToday && dayTasks.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card px-4 py-4 text-center">
                <p className="font-sans text-sm text-gray-400">No tasks for today</p>
              </div>
            )}

            {/* Task cards — pending first, then done with divider */}
            {dayTasks.length > 0 && (
              <div className="space-y-2">
                {pending.map(t => (
                  <TaskCard
                    key={t.id} task={t} onTap={setSelected} onDelete={onDelete} canDelete
                    assigneeName={t.assignedTo ? assigneeMap[t.assignedTo] : null}
                  />
                ))}
                {pending.length > 0 && done.length > 0 && (
                  <div className="flex items-center gap-2 py-1">
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                    <span className="font-sans text-[10px] text-mint-500 font-semibold">Completed</span>
                    <div className="flex-1 h-px bg-gray-100 dark:bg-gray-700" />
                  </div>
                )}
                {done.map(t => (
                  <TaskCard
                    key={t.id} task={t} onTap={setSelected} onDelete={onDelete} canDelete
                    assigneeName={t.assignedTo ? assigneeMap[t.assignedTo] : null}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add task for today shortcut */}
      <button
        onClick={() => setCreateDate(today)}
        className="w-full py-3 rounded-2xl font-sans font-bold text-sm text-blush-400 bg-blush-50 dark:bg-blush-500/10 border-2 border-dashed border-blush-200 dark:border-blush-500/20 hover:bg-blush-100 transition-all"
      >+ Add Task for Today</button>

      {selected && (
        <TaskDetailSheet
          task={selected}
          onClose={() => setSelected(null)}
          onComplete={onComplete}
          onReopen={id => { onReopen(id); setSelected(null) }}
          onDelete={id => { onDelete(id); setSelected(null) }}
          onEdit={task => { setSelected(null); setEditingTask(task) }}
          assigneeName={selected.assignedTo ? assigneeMap[selected.assignedTo] : null}
          showToast={showToast}
        />
      )}
      {createDate !== null && (
        <CreateTaskSheet
          helperProfiles={helperProfiles}
          existing={{ dueDate: createDate }}
          onSave={onCreateTask}
          onClose={() => setCreateDate(null)}
        />
      )}
      {editingTask && (
        <CreateTaskSheet
          helperProfiles={helperProfiles}
          existing={editingTask}
          onSave={async data => {
            const result = await onUpdateTask(editingTask.id, data)
            if (result?.error) showToast?.('Could not save changes — please try again')
            return result
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  )
}

// ─── Assign Template Sheet ────────────────────────────────────
function AssignTemplateSheet({ template, helperProfiles, tasks, onAssign, onClose, showToast, onNavigate }) {
  const today    = localToday()
  const [assignTo, setAssignTo] = useState(helperProfiles[0]?.id ?? '')
  const [dueDate,  setDueDate]  = useState(today)
  const [loading,  setLoading]  = useState(false)

  const alreadyAssigned = tasks.some(t => t.templateId === template.id && t.dueDate === dueDate)

  async function handleAssign() {
    if (!assignTo) return
    setLoading(true)
    const result = await onAssign(template.id, assignTo, dueDate)
    setLoading(false)
    if (result?.alreadyAssigned) {
      showToast?.(`Already assigned for ${dueDate === today ? 'today' : dueDate}`)
    } else {
      const helper = helperProfiles.find(p => p.id === assignTo)
      showToast?.(`✓ Assigned to ${helper?.displayName ?? 'helper'}`)
      onClose()
      onNavigate?.('schedule')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl p-5 pb-safe animate-slide-up">
        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700 mx-auto mb-4" />
        <h3 className="font-sans font-bold text-base text-gray-800 dark:text-gray-100 mb-4">Assign Template</h3>

        {/* Template preview */}
        <div className="flex items-center gap-3 mb-5 p-3 rounded-2xl" style={{ backgroundColor: template.color + '22' }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: template.color + '44' }}>
            {template.emoji}
          </div>
          <div>
            <p className="font-sans font-bold text-sm text-gray-800 dark:text-gray-100">{template.name}</p>
            <p className="font-sans text-xs text-gray-500">{template.items.length} task{template.items.length !== 1 ? 's' : ''}: {template.items.slice(0, 3).map(i => i.title).join(', ')}{template.items.length > 3 ? '…' : ''}</p>
          </div>
        </div>

        {/* Assign to — only show if multiple helpers */}
        {helperProfiles.length === 0 && (
          <div className="bg-amber-50 dark:bg-amber-500/10 rounded-xl px-3 py-2.5 mb-4">
            <p className="font-sans text-xs text-amber-600 dark:text-amber-400">No helper accounts found. Create a helper profile first.</p>
          </div>
        )}
        {helperProfiles.length > 0 && (
          <div className="mb-4">
            <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Assign to</label>
            <div className="flex gap-2 flex-wrap">
              {helperProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => setAssignTo(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-sans text-sm font-semibold transition-all ${
                    assignTo === p.id
                      ? 'bg-blush-400 text-white shadow'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <span>{p.avatar}</span> {p.displayName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Due date */}
        <div className="mb-5">
          <label className="font-sans text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-1.5">Due date</label>
          <input
            type="date"
            value={dueDate}
            min={today}
            onChange={e => setDueDate(e.target.value)}
            className="w-full rounded-xl border-2 border-gray-100 dark:border-gray-700 px-3 py-2.5 font-sans text-sm dark:bg-gray-800 dark:text-white focus:outline-none focus:border-blush-200"
          />
          {alreadyAssigned && (
            <p className="font-sans text-xs text-amber-500 mt-1.5">⚠️ Already assigned for this date — assigning again will create duplicates.</p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl font-sans font-bold text-sm text-gray-500 bg-gray-100 dark:bg-gray-800">Cancel</button>
          <button
            onClick={handleAssign}
            disabled={loading || helperProfiles.length === 0}
            className="flex-1 py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow disabled:opacity-50"
          >{loading ? 'Assigning…' : '📋 Assign Tasks'}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Manager: Templates Tab ───────────────────────────────────
function TemplatesTab({ templates, helperProfiles, tasks, onCreateTemplate, onUpdateTemplate, onDeleteTemplate, onAssignTemplate, showToast, onNavigate }) {
  const [showCreate,    setShowCreate]    = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [assigningTmpl, setAssigningTmpl] = useState(null)

  return (
    <div>
      {templates.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="text-5xl mb-3">📂</div>
          <p className="font-sans font-semibold text-gray-500 dark:text-gray-400">No templates yet</p>
          <p className="font-sans text-sm text-gray-400 mt-1">Create reusable chore bundles below</p>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {templates.map(tmpl => (
          <div key={tmpl.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0" style={{ backgroundColor: tmpl.color + '33' }}>
                {tmpl.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-bold text-sm text-gray-800 dark:text-gray-100">{tmpl.name}</p>
                <p className="font-sans text-xs text-gray-400">{tmpl.items.length} task{tmpl.items.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => setEditing(tmpl)}
                  className="px-2.5 py-1.5 rounded-lg font-sans text-xs font-bold text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 transition-all"
                >Edit</button>
                <button
                  onClick={() => { if (confirm(`Delete "${tmpl.name}"?`)) onDeleteTemplate(tmpl.id) }}
                  className="px-2.5 py-1.5 rounded-lg font-sans text-xs font-bold text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 transition-all"
                >✕</button>
              </div>
            </div>
            {/* Items preview */}
            <div className="border-t border-gray-50 dark:border-gray-700/50 px-4 py-2 bg-gray-50/50 dark:bg-gray-700/20">
              <div className="flex flex-wrap gap-1.5">
                {tmpl.items.slice(0, 4).map((item, i) => (
                  <span key={i} className="font-sans text-[10px] text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {catMeta(item.category).emoji} {item.title}
                  </span>
                ))}
                {tmpl.items.length > 4 && (
                  <span className="font-sans text-[10px] text-gray-400 px-2 py-0.5">+{tmpl.items.length - 4} more</span>
                )}
              </div>
            </div>
            {/* Assign button */}
            <div className="px-4 py-3">
              <button
                onClick={() => setAssigningTmpl(tmpl)}
                className="w-full py-2.5 rounded-xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all"
              >📋 Assign</button>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => setShowCreate(true)}
        className="w-full py-3 rounded-2xl font-sans font-bold text-sm text-white bg-gradient-to-r from-blush-300 to-lavender-400 shadow hover:shadow-md transition-all"
      >+ New Template</button>

      {showCreate && (
        <CreateTemplateSheet
          onSave={(tmplData, items) => onCreateTemplate(tmplData, items)}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <CreateTemplateSheet
          existing={editing}
          onSave={async (tmplData, items) => {
            const result = await onUpdateTemplate(editing.id, tmplData, items)
            if (result?.error) showToast?.('Save failed — please try again')
            return result
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {assigningTmpl && (
        <AssignTemplateSheet
          template={assigningTmpl}
          helperProfiles={helperProfiles}
          tasks={tasks}
          onAssign={onAssignTemplate}
          onClose={() => setAssigningTmpl(null)}
          showToast={showToast}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}

// ─── Manager: History Tab ─────────────────────────────────────
function HistoryTab({ tasks, helperProfiles }) {
  const [detailTask, setDetailTask] = useState(null)
  const today = localToday()

  const assigneeMap = useMemo(() => {
    const m = {}
    for (const p of helperProfiles) m[p.id] = p.displayName
    return m
  }, [helperProfiles])

  const pastTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate < today)
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
  }, [tasks, today])

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map()
    for (const t of pastTasks) {
      if (!map.has(t.dueDate)) map.set(t.dueDate, [])
      map.get(t.dueDate).push(t)
    }
    return [...map.entries()]
  }, [pastTasks])

  if (grouped.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="text-5xl mb-3">🕰️</div>
        <p className="font-sans font-semibold text-gray-500 dark:text-gray-400">No task history yet</p>
        <p className="font-sans text-sm text-gray-400 mt-1">Past tasks will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {grouped.map(([date, dayTasks]) => {
        const done    = dayTasks.filter(t => t.status === 'done').length
        const missed  = dayTasks.length - done
        const display = new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
        return (
          <div key={date}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="font-sans text-xs font-bold text-gray-500 dark:text-gray-400">{display}</p>
              <div className="flex items-center gap-1.5">
                {missed > 0 && (
                  <span className="font-sans text-[10px] font-bold px-1.5 py-0.5 rounded-full text-red-400 bg-red-50 dark:bg-red-500/10">
                    {missed} missed
                  </span>
                )}
                <span className={`font-sans text-xs font-bold px-2 py-0.5 rounded-full ${done === dayTasks.length ? 'text-mint-600 bg-mint-50 dark:bg-mint-500/10' : 'text-amber-500 bg-amber-50 dark:bg-amber-500/10'}`}>
                  {done}/{dayTasks.length}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {dayTasks.map(task => (
                <div
                  key={task.id}
                  onClick={() => setDetailTask(task)}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-card px-3.5 py-3 flex items-center gap-3 cursor-pointer hover:shadow-card-md transition-all"
                >
                  <span className="text-base flex-shrink-0">{task.status === 'done' ? '✅' : '⬜'}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-sans font-semibold text-sm text-gray-700 dark:text-gray-100 leading-snug ${task.status === 'done' ? 'line-through opacity-60' : 'text-red-500 dark:text-red-400'}`}>{task.title}</p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {task.assignedTo && assigneeMap[task.assignedTo] && (
                        <span className="font-sans text-[10px] font-semibold text-lavender-500 bg-lavender-50 dark:bg-lavender-500/10 px-1.5 py-0.5 rounded-full">
                          {assigneeMap[task.assignedTo]}
                        </span>
                      )}
                      {task.completedAt && (
                        <span className="font-sans text-[10px] text-mint-500">
                          ✓ {new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {task.status !== 'done' && (
                        <span className="font-sans text-[10px] text-red-400 font-semibold">Not completed</span>
                      )}
                    </div>
                  </div>
                  {task.completedPhoto && (
                    <img src={task.completedPhoto} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {detailTask && (
        <TaskDetailSheet task={detailTask} onClose={() => setDetailTask(null)} onReopen={() => {}} onDelete={() => {}} readOnly />
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────
export default function TasksPage({ user, showToast }) {
  const isAdmin = user?.role === 'admin'
  const {
    tasks, templates, helperProfiles, loading,
    createTask, completeTask, reopenTask, deleteTask, updateTask,
    createTemplate, updateTemplate, deleteTemplate, assignTemplate,
  } = useTasks(user?.id, user?.role)

  const [activeTab, setActiveTab] = useState('schedule')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-blush-100 border-t-blush-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <HelperView user={user} tasks={tasks} onComplete={completeTask} />
  }

  const today      = localToday()
  const todayDone  = tasks.filter(t => t.dueDate === today && t.status === 'done').length
  const todayAll   = tasks.filter(t => t.dueDate === today).length
  const futureAll  = tasks.filter(t => t.dueDate > today).length
  const overdueAll = tasks.filter(t => t.dueDate < today && t.status === 'pending').length

  const TABS = [
    { id: 'schedule',  label: 'Schedule', badge: overdueAll > 0 ? `${todayDone}/${todayAll} · ${overdueAll}⚠` : todayAll > 0 ? `${todayDone}/${todayAll}` : null },
    { id: 'templates', label: 'Templates', badge: templates.length > 0 ? `${templates.length}` : null },
    { id: 'history',   label: 'History',   badge: null },
  ]

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 pb-10 pt-4 animate-fade-in">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-card mb-5">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-xl font-sans font-bold text-xs transition-all flex flex-col items-center gap-0.5 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-blush-50 to-lavender-50 dark:from-blush-500/10 dark:to-lavender-500/10 text-blush-500 shadow-sm'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
            }`}
          >
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={`font-sans text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
                tab.badge.includes('⚠') ? 'bg-red-50 dark:bg-red-500/10 text-red-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              } ${activeTab === tab.id ? '!bg-blush-100 dark:!bg-blush-500/20 !text-blush-400' : ''}`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Future tasks banner */}
      {activeTab === 'schedule' && futureAll > 0 && (
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <span className="font-sans text-xs text-lavender-400 font-semibold">{futureAll} task{futureAll !== 1 ? 's' : ''} scheduled ahead</span>
        </div>
      )}

      {activeTab === 'schedule' && (
        <ScheduleTab
          tasks={tasks}
          helperProfiles={helperProfiles}
          onCreateTask={createTask}
          onUpdateTask={updateTask}
          onComplete={completeTask}
          onReopen={reopenTask}
          onDelete={deleteTask}
          showToast={showToast}
        />
      )}
      {activeTab === 'templates' && (
        <TemplatesTab
          templates={templates}
          helperProfiles={helperProfiles}
          tasks={tasks}
          onCreateTemplate={createTemplate}
          onUpdateTemplate={updateTemplate}
          onDeleteTemplate={deleteTemplate}
          onAssignTemplate={assignTemplate}
          showToast={showToast}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'history' && (
        <HistoryTab tasks={tasks} helperProfiles={helperProfiles} />
      )}
    </div>
  )
}
