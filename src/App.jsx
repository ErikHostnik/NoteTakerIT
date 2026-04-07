import { useState, useEffect } from 'react'
import { SAMPLE_NOTES, SAMPLE_DOCS, CATEGORIES } from './constants'
import { isToday } from './utils'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import NoteCard from './components/NoteCard'
import NoteModal from './components/NoteModal'
import ReportModal from './components/ReportModal'
import './App.css'

const STORAGE_KEY = 'it-notes-v3'
const DOCS_KEY = 'it-docs-v1'
const CAT_ORDER = ['setup', 'software', 'hardware', 'network', 'user-support', 'other']

export default function App() {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : SAMPLE_NOTES
    } catch { return SAMPLE_NOTES }
  })

  const [docs, setDocs] = useState(() => {
    try {
      const saved = localStorage.getItem(DOCS_KEY)
      return saved ? JSON.parse(saved) : SAMPLE_DOCS
    } catch { return SAMPLE_DOCS }
  })

  const [view, setView] = useState('logs') // 'logs' | 'docs'
  const [selectedDate, setSelectedDate] = useState(null)
  const [filters, setFilters] = useState({ category: 'all' })
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('it-notes-theme') !== 'light')

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)) }, [notes])
  useEffect(() => { localStorage.setItem(DOCS_KEY, JSON.stringify(docs)) }, [docs])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('it-notes-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // ── Logs filtering ────────────────────────────────────
  const filteredNotes = notes.filter(note => {
    if (selectedDate && note.date !== selectedDate) return false
    if (filters.category !== 'all' && note.category !== filters.category) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!note.title.toLowerCase().includes(q) &&
          !note.description.toLowerCase().includes(q) &&
          !note.tags.some(t => t.toLowerCase().includes(q)) &&
          !note.steps.some(s => s.text.toLowerCase().includes(q))) return false
    }
    return true
  })

  // ── Docs filtering ────────────────────────────────────
  const filteredDocs = docs.filter(doc => {
    if (filters.category !== 'all' && doc.category !== filters.category) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!doc.title.toLowerCase().includes(q) &&
          !doc.description.toLowerCase().includes(q) &&
          !doc.tags.some(t => t.toLowerCase().includes(q)) &&
          !doc.steps.some(s => s.text.toLowerCase().includes(q))) return false
    }
    return true
  })

  const docsByCategory = CAT_ORDER
    .map(cat => ({ cat, label: CATEGORIES[cat]?.label || cat, items: filteredDocs.filter(d => d.category === cat) }))
    .filter(g => g.items.length > 0)

  // ── CRUD ─────────────────────────────────────────────
  const openCreate = () => { setEditingNote(null); setModalOpen(true) }
  const openEdit = (note) => { setEditingNote(note); setModalOpen(true) }

  const saveNote = (data) => {
    const isDoc = view === 'docs'
    const record = { ...data, isDoc, id: editingNote?.id || `note-${Date.now()}`,
      createdAt: editingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString() }

    if (isDoc) {
      setDocs(prev => editingNote
        ? prev.map(d => d.id === editingNote.id ? record : d)
        : [...prev, record])
    } else {
      setNotes(prev => editingNote
        ? prev.map(n => n.id === editingNote.id ? record : n)
        : [...prev, record])
    }
    setModalOpen(false)
  }

  const deleteNote = (id) => {
    if (view === 'docs') setDocs(prev => prev.filter(d => d.id !== id))
    else setNotes(prev => prev.filter(n => n.id !== id))
  }

  const toggleStep = (noteId, stepId) => {
    const updater = prev => prev.map(note => {
      if (note.id !== noteId) return note
      return { ...note, steps: note.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s), updatedAt: new Date().toISOString() }
    })
    if (view === 'docs') setDocs(updater)
    else setNotes(updater)
  }

  // ── Grouped logs ──────────────────────────────────────
  const groupByDate = view === 'logs' && !selectedDate
  const notesByDate = groupByDate
    ? [...new Set(filteredNotes.map(n => n.date))].sort((a, b) => b.localeCompare(a))
        .map(date => ({ date, notes: filteredNotes.filter(n => n.date === date) }))
    : null

  const mainTitle = view === 'docs' ? 'Documentation'
    : selectedDate
      ? isToday(selectedDate) ? "Today's Logs"
        : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : filters.category !== 'all'
        ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1).replace('-', ' ')} Logs`
        : search ? `Search: "${search}"` : 'All Logs'

  const totalCount = view === 'docs' ? filteredDocs.length : filteredNotes.length

  return (
    <div className="app">
      <Header search={search} onSearch={setSearch} onCreateNote={openCreate}
        onOpenReport={() => setReportOpen(true)} isDark={isDark} onToggleTheme={() => setIsDark(v => !v)} />
      <div className="app-body">
        <Sidebar
          notes={notes}
          selectedDate={selectedDate}
          onSelectDate={(d) => { setSelectedDate(d); setView('logs') }}
          filters={filters}
          onFiltersChange={setFilters}
          view={view}
          onSetView={(v) => { setView(v); setSelectedDate(null) }}
        />
        <main className="main-content">
          <div className="main-header">
            <h2 className="main-title">
              {mainTitle}
              <span className="main-title-count">{totalCount}</span>
            </h2>
          </div>

          {/* ── DOCS VIEW ── */}
          {view === 'docs' && (
            filteredDocs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <p>No documentation yet</p>
                <button onClick={openCreate}>+ Add Documentation</button>
              </div>
            ) : (
              <div className="notes-grouped">
                {docsByCategory.map(({ cat, label, items }) => (
                  <div key={cat} className="date-group">
                    <div className="date-group-header">
                      <div className="date-group-line" />
                      <span className="date-group-label">{label}</span>
                      <div className="date-group-line" />
                      <span className="date-group-count">{items.length}</span>
                    </div>
                    <div className="notes-grid">
                      {items.map(doc => (
                        <NoteCard key={doc.id} note={doc} hideDate
                          onEdit={() => openEdit(doc)}
                          onDelete={() => deleteNote(doc.id)}
                          onToggleStep={toggleStep}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── LOGS VIEW ── */}
          {view === 'logs' && (
            filteredNotes.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">◈</div>
                <p>No logs found</p>
                <button onClick={openCreate}>+ Create a Log</button>
              </div>
            ) : groupByDate ? (
              <div className="notes-grouped">
                {notesByDate.map(({ date, notes: group }) => (
                  <div key={date} className="date-group">
                    <div className="date-group-header">
                      <div className="date-group-line" />
                      <span className="date-group-label">
                        {isToday(date) ? 'Today'
                          : new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <div className="date-group-line" />
                      <span className="date-group-count">{group.length}</span>
                    </div>
                    <div className="notes-grid">
                      {group.map(note => (
                        <NoteCard key={note.id} note={note}
                          onEdit={() => openEdit(note)}
                          onDelete={() => deleteNote(note.id)}
                          onToggleStep={toggleStep}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="notes-grid">
                {filteredNotes.map(note => (
                  <NoteCard key={note.id} note={note}
                    onEdit={() => openEdit(note)}
                    onDelete={() => deleteNote(note.id)}
                    onToggleStep={toggleStep}
                  />
                ))}
              </div>
            )
          )}
        </main>
      </div>

      {modalOpen && (
        <NoteModal note={editingNote} isDoc={view === 'docs'} onSave={saveNote}
          onClose={() => setModalOpen(false)} onToggleStep={toggleStep} />
      )}
      {reportOpen && (
        <ReportModal notes={notes} onClose={() => setReportOpen(false)} />
      )}
    </div>
  )
}
