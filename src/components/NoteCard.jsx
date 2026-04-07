import { CATEGORIES } from '../constants'
import { formatDateShort } from '../utils'

const CAT_COLOR = {
  hardware: 'var(--amber)', software: 'var(--blue)', network: 'var(--teal)',
  'user-support': 'var(--purple)', setup: 'var(--green)', other: 'var(--gray)',
}
const CAT_DIM = {
  hardware: 'var(--amber-dim)', software: 'var(--blue-dim)', network: 'var(--teal-dim)',
  'user-support': 'var(--purple-dim)', setup: 'var(--green-dim)', other: 'var(--gray-dim)',
}

export default function NoteCard({ note, onEdit, onDelete, onToggleStep, hideDate = false }) {
  const catColor = CAT_COLOR[note.category] || 'var(--gray)'
  const catDim = CAT_DIM[note.category] || 'var(--gray-dim)'
  const stepsTotal = note.steps.length

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${note.title}"?`)) onDelete()
  }

  return (
    <div
      className="note-card"
      style={{ borderLeftColor: catColor, '--card-glow': catDim }}
      onClick={onEdit}
    >
      <style>{`.note-card::before { background: linear-gradient(135deg, var(--card-glow) 0%, transparent 55%); }`}</style>

      {/* Badges row */}
      <div className="card-top-row">
        <span className="badge badge-category" style={{ background: catDim, color: catColor }}>
          {CATEGORIES[note.category]?.label || note.category}
        </span>
      </div>

      {/* Title */}
      <div className="card-title">{note.title}</div>

      {/* Description */}
      {note.description && <div className="card-desc">{note.description}</div>}

      {/* Steps count */}
      {stepsTotal > 0 && (
        <div className="card-steps">
          <span className="card-steps-label">⋮ {stepsTotal} step{stepsTotal !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Bottom row */}
      <div className="card-bottom-row">
        {!hideDate && <span className="card-date">{formatDateShort(note.date)}</span>}
        <div className="card-tags">
          {note.tags.slice(0, 3).map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
        <div className="card-actions">
          <button className="card-action-btn card-action-btn-edit" onClick={(e) => { e.stopPropagation(); onEdit() }} title="Edit">✎</button>
          <button className="card-action-btn card-action-btn-delete" onClick={handleDelete} title="Delete">✕</button>
        </div>
      </div>
    </div>
  )
}
