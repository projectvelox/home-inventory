import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { localToday } from '../lib/taskUtils'

function taskFromDB(row) {
  return {
    id:               row.id,
    title:            row.title,
    description:      row.description      ?? null,
    category:         row.category,
    status:           row.status,
    assignedTo:       row.assigned_to      ?? null,
    createdBy:        row.created_by       ?? null,
    templateId:       row.template_id      ?? null,
    dueDate:          row.due_date,
    completedAt:      row.completed_at     ?? null,
    completedPhoto:   row.completed_photo  ?? null,
    completionNotes:  row.completion_notes ?? null,
    estimatedMins:    row.estimated_mins   ?? null,
    sortOrder:        row.sort_order       ?? 0,
    recurType:        row.recur_type       ?? 'none',
    recurDays:        row.recur_days       ?? null,
    lastAssigned:     row.last_assigned    ?? null,
    createdAt:        row.created_at,
  }
}

function templateFromDB(row) {
  return {
    id:          row.id,
    name:        row.name,
    description: row.description ?? null,
    color:       row.color  ?? '#c4b5fd',
    emoji:       row.emoji  ?? '📋',
    createdBy:   row.created_by ?? null,
    recurType:   row.recur_type ?? 'none',
    recurDays:   row.recur_days ?? null,
    items: (row.task_template_items ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(i => ({
        id:            i.id,
        title:         i.title,
        description:   i.description    ?? null,
        category:      i.category,
        estimatedMins: i.estimated_mins ?? null,
        sortOrder:     i.sort_order,
      })),
    createdAt: row.created_at,
  }
}

export function useTasks(userId, role) {
  const [tasks,          setTasks]          = useState([])
  const [templates,      setTemplates]      = useState([])
  const [helperProfiles, setHelperProfiles] = useState([])
  const [loading,        setLoading]        = useState(true)
  const loadSeqRef = useRef(0)

  useEffect(() => {
    if (!userId) return
    Promise.allSettled([
      loadTasks(),
      loadTemplates(),
      role === 'admin' ? loadHelperProfiles() : Promise.resolve(),
    ]).then(() => setLoading(false))

    // Debounce realtime reloads: batch rapid consecutive DB events (e.g. template assign inserts N tasks)
    let taskTimer = null
    let tmplTimer = null
    const debouncedLoadTasks    = () => { clearTimeout(taskTimer); taskTimer = setTimeout(loadTasks,    250) }
    const debouncedLoadTemplates = () => { clearTimeout(tmplTimer); tmplTimer = setTimeout(loadTemplates, 250) }

    const taskChannel = supabase
      .channel('rt-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, debouncedLoadTasks)
      .subscribe()

    const tmplChannel = supabase
      .channel('rt-task-templates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_templates' }, debouncedLoadTemplates)
      .subscribe()

    return () => {
      clearTimeout(taskTimer)
      clearTimeout(tmplTimer)
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(tmplChannel)
    }
  }, [userId, role])

  async function loadTasks() {
    const seq = ++loadSeqRef.current
    let query = supabase.from('tasks').select('*').order('sort_order').order('created_at')
    if (role === 'helper') {
      // Load 7 days back (for late completions) through 60 days ahead (for upcoming scheduled tasks)
      const now      = new Date()
      const fromDay  = new Date(now); fromDay.setDate(now.getDate() - 7)
      const toDay    = new Date(now); toDay.setDate(now.getDate() + 60)
      query = query
        .eq('assigned_to', userId)
        .gte('due_date', fromDay.toISOString().slice(0, 10))
        .lte('due_date', toDay.toISOString().slice(0, 10))
    }
    const { data } = await query
    if (!data || seq !== loadSeqRef.current) return  // stale result — a newer load is in flight, discard
    setTasks(prev => {
      // Preserve any optimistic (temp_*) tasks that haven't been confirmed yet
      // so that a realtime reload mid-insert doesn't wipe the optimistic update
      const dbIds = new Set(data.map(t => t.id))
      const pendingOptimistic = prev.filter(t => String(t.id).startsWith('temp_') && !dbIds.has(t.id))
      return [...data.map(taskFromDB), ...pendingOptimistic]
    })
  }

  async function loadTemplates() {
    if (role === 'helper') return
    const { data } = await supabase
      .from('task_templates')
      .select('*, task_template_items(*)')
      .order('created_at')
    if (data) setTemplates(data.map(templateFromDB))
  }

  async function loadHelperProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar, role')
      .order('display_name')
    if (error) { console.error('loadHelperProfiles error:', error.message, error); return }
    if (data) setHelperProfiles(data.map(p => ({
      id:          p.id,
      displayName: p.display_name ?? 'User',
      avatar:      p.avatar ?? '👤',
      role:        p.role ?? 'helper',
    })))
  }

  // Safe estimatedMins: rejects 0, negatives, NaN, non-numbers
  function safeEstMins(v) { const n = Number(v); return Number.isFinite(n) && n > 0 ? Math.round(Math.min(n, 1440)) : null }

  async function createTask(taskData) {
    const tempId     = `temp_${Date.now()}`
    const optimistic = { id: tempId, ...taskData, status: 'pending', completedAt: null, completedPhoto: null, completionNotes: null, createdAt: new Date().toISOString() }
    setTasks(prev => [...prev, optimistic])
    const { data, error } = await supabase.from('tasks').insert([{
      title:          taskData.title,
      description:    taskData.description    || null,
      category:       taskData.category       || 'other',
      assigned_to:    taskData.assignedTo     || null,
      created_by:     userId,
      due_date:       taskData.dueDate        || localToday(),
      estimated_mins: safeEstMins(taskData.estimatedMins),
      sort_order:     tasks.filter(t => !String(t.id).startsWith('temp_')).length,
      recur_type:     taskData.recurType      || 'none',
      recur_days:     taskData.recurDays      ?? null,
    }]).select().single()
    if (error) {
      console.error('createTask error:', error.message, error)
      // Replace optimistic with error-flagged version so it stays visible
      // (loadTasks on next navigation will clean it up)
      return
    }
    if (data) {
      setTasks(prev => {
        const hasTemp = prev.some(t => t.id === tempId)
        if (hasTemp) return prev.map(t => t.id === tempId ? taskFromDB(data) : t)
        // Optimistic was already replaced by a realtime loadTasks — check if real task is there
        if (prev.some(t => t.id === data.id)) return prev
        return [...prev, taskFromDB(data)]
      })
    }
  }

  async function completeTask(id, { photo, notes } = {}) {
    const prevTask = tasks.find(t => t.id === id)
    const now = new Date().toISOString()
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: 'done', completedAt: now, completedPhoto: photo || null, completionNotes: notes || null }
      : t
    ))
    const { error } = await supabase.from('tasks').update({
      status:           'done',
      completed_at:     now,
      completed_photo:  photo || null,
      completion_notes: notes || null,
    }).eq('id', id)
    if (error) {
      console.error('completeTask error:', error.message)
      if (prevTask) setTasks(prev => prev.map(t => t.id === id ? prevTask : t))
      return { error }
    }
    return { error: null }
  }

  async function reopenTask(id) {
    const prevTask = tasks.find(t => t.id === id)
    setTasks(prev => prev.map(t => t.id === id
      ? { ...t, status: 'pending', completedAt: null, completedPhoto: null, completionNotes: null }
      : t
    ))
    const { error } = await supabase.from('tasks').update({
      status:           'pending',
      completed_at:     null,
      completed_photo:  null,
      completion_notes: null,
    }).eq('id', id)
    if (error) {
      console.error('reopenTask error:', error.message)
      if (prevTask) setTasks(prev => prev.map(t => t.id === id ? prevTask : t))
      return { error }
    }
    return { error: null }
  }

  async function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function updateTask(id, taskData) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...taskData } : t))
    const { error } = await supabase.from('tasks').update({
      title:          taskData.title,
      description:    taskData.description    || null,
      category:       taskData.category       || 'other',
      assigned_to:    taskData.assignedTo     || null,
      due_date:       taskData.dueDate        || localToday(),
      estimated_mins: safeEstMins(taskData.estimatedMins),
      recur_type:     taskData.recurType      || 'none',
      recur_days:     taskData.recurDays      ?? null,
    }).eq('id', id)
    if (error) {
      console.error('updateTask error:', error.message, error)
      await loadTasks() // revert optimistic update on error
      return { error }
    }
    await loadTasks() // force re-sync so UI always reflects DB truth
    return { error: null }
  }

  async function createTemplate(tmplData, itemsList) {
    const { data: tmpl, error: tmplErr } = await supabase.from('task_templates').insert([{
      name:        tmplData.name,
      description: tmplData.description || null,
      color:       tmplData.color       || '#c4b5fd',
      emoji:       tmplData.emoji       || '📋',
      created_by:  userId,
      recur_type:  tmplData.recurType   || 'none',
    }]).select().single()
    if (tmplErr || !tmpl) {
      console.error('createTemplate error:', tmplErr?.message, tmplErr)
      return { error: tmplErr ?? new Error('Insert returned no data') }
    }

    if (itemsList.length > 0) {
      const { error: itemsErr } = await supabase.from('task_template_items').insert(
        itemsList.map((item, idx) => ({
          template_id:    tmpl.id,
          title:          item.title,
          description:    item.description    || null,
          category:       item.category       || 'other',
          estimated_mins: item.estimatedMins  || null,
          sort_order:     idx,
        }))
      )
      if (itemsErr) {
        console.error('createTemplate items error:', itemsErr.message, itemsErr)
        return { error: itemsErr }
      }
    }
    await loadTemplates()
    return { error: null }
  }

  async function updateTemplate(id, tmplData, itemsList) {
    const { error: upErr } = await supabase.from('task_templates').update({
      name:        tmplData.name,
      description: tmplData.description || null,
      color:       tmplData.color,
      emoji:       tmplData.emoji,
      recur_type:  tmplData.recurType   || 'none',
    }).eq('id', id)
    if (upErr) {
      console.error('updateTemplate error:', upErr.message, upErr)
      return { error: upErr }
    }

    // Replace all items
    await supabase.from('task_template_items').delete().eq('template_id', id)
    if (itemsList.length > 0) {
      const { error: itemsErr } = await supabase.from('task_template_items').insert(
        itemsList.map((item, idx) => ({
          template_id:    id,
          title:          item.title,
          description:    item.description    || null,
          category:       item.category       || 'other',
          estimated_mins: item.estimatedMins  || null,
          sort_order:     idx,
        }))
      )
      if (itemsErr) {
        console.error('updateTemplate items error:', itemsErr.message, itemsErr)
        return { error: itemsErr }
      }
    }
    await loadTemplates()
    return { error: null }
  }

  async function deleteTemplate(id) {
    setTemplates(prev => prev.filter(t => t.id !== id))
    await supabase.from('task_templates').delete().eq('id', id)
  }

  async function assignTemplate(templateId, assignedTo, dueDate) {
    const tmpl = templates.find(t => t.id === templateId)
    if (!tmpl || tmpl.items.length === 0) return { alreadyAssigned: false }
    const today = dueDate || localToday()

    // Idempotency: don't create duplicates for the same template+day
    const existing = tasks.filter(t => t.templateId === templateId && t.dueDate === today)
    if (existing.length > 0) return { alreadyAssigned: true }

    await supabase.from('tasks').insert(
      tmpl.items.map((item, idx) => ({
        title:          item.title,
        description:    item.description    || null,
        category:       item.category       || 'other',
        estimated_mins: item.estimatedMins  || null,
        sort_order:     idx,
        assigned_to:    assignedTo,
        created_by:     userId,
        template_id:    templateId,
        due_date:       today,
        status:         'pending',
      }))
    )
    await loadTasks()
    return { alreadyAssigned: false }
  }

  // Auto-assign any recurring templates that are due today/this week but not yet assigned.
  // Called once after initial load (admin only). Silently creates tasks — no UI needed.
  async function autoAssignDueTemplates(helperIdFallback) {
    if (role !== 'admin') return { assigned: 0 }
    const today = localToday()
    // Monday of this week (for weekly recurrence)
    const now   = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    const weekStart = monday.toISOString().slice(0, 10)

    let assigned = 0
    for (const tmpl of templates) {
      if (!tmpl.recurType || tmpl.recurType === 'none') continue

      const isDueDaily  = tmpl.recurType === 'daily'
      const isDueWeekly = tmpl.recurType === 'weekly'

      // Check if already assigned for today (daily) or this week (weekly)
      const alreadyToday = tasks.some(t => t.templateId === tmpl.id && t.dueDate === today)
      const alreadyWeek  = tasks.some(t => t.templateId === tmpl.id && t.dueDate >= weekStart && t.dueDate <= today)

      if (isDueDaily  && alreadyToday) continue
      if (isDueWeekly && alreadyWeek)  continue

      // Find a helper to assign to — use first helper profile or leave unassigned
      const assignTo = helperIdFallback ?? null

      const { error } = await supabase.from('tasks').insert(
        tmpl.items.map((item, idx) => ({
          title:          item.title,
          description:    item.description    || null,
          category:       item.category       || 'other',
          estimated_mins: item.estimatedMins  || null,
          sort_order:     idx,
          assigned_to:    assignTo,
          created_by:     userId,
          template_id:    tmpl.id,
          due_date:       today,
          status:         'pending',
          recur_type:     tmpl.recurType,
        }))
      )
      if (!error) assigned++
    }
    await loadTasks()
    return { assigned }
  }

  return {
    tasks, templates, helperProfiles, loading,
    createTask, completeTask, reopenTask, deleteTask, updateTask,
    createTemplate, updateTemplate, deleteTemplate, assignTemplate,
    autoAssignDueTemplates,
  }
}
