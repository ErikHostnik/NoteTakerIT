import { useState, useEffect, useRef } from 'react'
import { CATEGORIES, TODAY } from '../constants'
import { genId, formatDate, parseArrowFormat } from '../utils'

const EMPTY_NOTE = {
  title: '', date: TODAY, category: 'hardware',
  description: '', steps: [], tags: [],
}

const CAT_COLOR = {
  hardware: 'var(--amber)', software: 'var(--blue)', network: 'var(--teal)',
  'user-support': 'var(--purple)', setup: 'var(--green)', other: 'var(--gray)',
}

export default function NoteModal({ note, isDoc = false, onSave, onClose, onToggleStep }) {
  const isNew = !note
  const [mode, setMode] = useState(isNew ? 'edit' : 'view')
  const [form, setForm] = useState(note ? { ...note } : { ...EMPTY_NOTE })

  const [importText, setImportText] = useState('')
  const [showImport, setShowImport] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (mode === 'edit' && titleRef.current) titleRef.current.focus()
  }, [mode])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))
  const setTags = (raw) => setField('tags', raw.split(',').map(t => t.trim()).filter(Boolean))

  const addStep = () => setField('steps', [...form.steps, { id: genId(), text: '', level: 0, completed: false }])
  const updateStep = (id, updates) => setField('steps', form.steps.map(s => s.id === id ? { ...s, ...updates } : s))
  const deleteStep = (id) => setField('steps', form.steps.filter(s => s.id !== id))
  const indentStep = (id, dir) => {
    const step = form.steps.find(s => s.id === id)
    if (step) updateStep(id, { level: Math.min(2, Math.max(0, step.level + dir)) })
  }

  const importFromText = () => {
    if (!importText.trim()) return
    setField('steps', [...form.steps, ...parseArrowFormat(importText)])
    setImportText('')
    setShowImport(false)
  }

  const handleSave = () => {
    if (!form.title.trim()) { titleRef.current?.focus(); return }
    onSave(form)
  }

  // ── VIEW MODE ──────────────────────────────────────────────
  if (mode === 'view') {
    const catColor = CAT_COLOR[form.category] || 'var(--gray)'

    return (
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal">
          <div className="modal-header">
            <div className="modal-title-text">{form.title}</div>
            <button className="btn btn-sm btn-ghost" onClick={() => setMode('edit')}>✎ Edit</button>
            <button className="modal-close-btn" onClick={onClose}>✕</button>
          </div>

          <div className="modal-body">
            <div className="view-meta">
              <span className="badge" style={{ background: `${catColor}22`, color: catColor }}>
                {CATEGORIES[form.category]?.label}
              </span>
              <span className="badge" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                📅 {formatDate(form.date)}
              </span>
            </div>

            {form.description && (
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Description</div>
                <div className="view-desc">{form.description}</div>
              </div>
            )}

            {form.steps.length > 0 && (
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>
                  Steps — {form.steps.length} total
                </div>
                <div className="view-steps-list">
                  {form.steps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="view-step"
                      style={{ paddingLeft: `${8 + step.level * 24}px` }}
                    >
                      <span className="view-step-num">{idx + 1}.</span>
                      <span className="view-step-text">{step.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.tags.length > 0 && (
              <div>
                <div className="form-label" style={{ marginBottom: 6 }}>Tags</div>
                <div className="view-tags">
                  {form.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ── EDIT MODE ──────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title-text">{isNew ? (isDoc ? '+ New Doc' : '+ New Log') : 'Edit'}</div>
          {!isNew && (
            <button className="btn btn-sm btn-ghost" onClick={() => setMode('view')}>◎ View</button>
          )}
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              ref={titleRef}
              className="form-input form-input-large"
              placeholder="e.g. Call 2 — HP Printer Not Found on IP Scanner"
              value={form.title}
              onChange={e => setField('title', e.target.value)}
            />
          </div>

          <div className="form-row">
            {!isDoc && (
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setField('date', e.target.value)} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={form.category} onChange={e => setField('category', e.target.value)}>
                {Object.entries(CATEGORIES).map(([k, { label }]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Brief summary of the issue or task…"
              value={form.description}
              onChange={e => setField('description', e.target.value)}
            />
          </div>

          <div className="steps-section">
            <div className="steps-header">
              <span className="form-label">Steps / Notes</span>
              <button className="btn btn-sm btn-ghost" onClick={() => setShowImport(v => !v)}>
                ↓ Import arrow format
              </button>
            </div>

            {showImport && (
              <div className="import-panel">
                <div className="import-panel-hint">
                  Paste arrow-format notes:<br />
                  <code style={{ color: 'var(--teal)' }}>{'----> Step text'}</code><br />
                  <code style={{ color: 'var(--teal)' }}>{'-----> Sub-step text'}</code><br />
                  <code style={{ color: 'var(--teal)' }}>{'------> Deeper sub-step'}</code>
                </div>
                <textarea
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder="----> Step 1&#10;-----> Sub-step&#10;----> Step 2"
                />
                <div className="import-panel-actions">
                  <button className="btn btn-sm btn-primary" onClick={importFromText}>Parse & Import</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setShowImport(false)}>Cancel</button>
                </div>
              </div>
            )}

            <div className="steps-list">
              {form.steps.map((step, idx) => (
                <div key={step.id} className="step-row" style={{ marginLeft: `${step.level * 24}px` }}>
                  <span className="step-num">{idx + 1}.</span>
                  <div className="step-indent-btns">
                    <button className="step-indent-btn" onClick={() => indentStep(step.id, -1)} disabled={step.level === 0}>←</button>
                    <button className="step-indent-btn" onClick={() => indentStep(step.id, 1)} disabled={step.level === 2}>→</button>
                  </div>
                  <input
                    className="step-input"
                    value={step.text}
                    placeholder="Step description…"
                    onChange={e => updateStep(step.id, { text: e.target.value })}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addStep() }
                      if (e.key === 'Tab') { e.preventDefault(); indentStep(step.id, e.shiftKey ? -1 : 1) }
                    }}
                  />
                  <button className="step-delete-btn" onClick={() => deleteStep(step.id)}>✕</button>
                </div>
              ))}
            </div>

            <button className="btn-add-step" onClick={addStep}>+ Add Step</button>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              className="form-input"
              placeholder="printer, hp, network, registry…"
              value={form.tags.join(', ')}
              onChange={e => setTags(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={handleSave}>
            {isNew ? (isDoc ? '+ Add Doc' : '+ Create Log') : '✓ Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
