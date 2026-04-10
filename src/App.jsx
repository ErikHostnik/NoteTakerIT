import { useState, useEffect, useCallback } from 'react'
import { CATEGORIES } from './constants'
import { isToday } from './utils'
import { api } from './api'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import NoteCard from './components/NoteCard'
import NoteModal from './components/NoteModal'
import ReportModal from './components/ReportModal'
import SettingsModal from './components/SettingsModal'
import LoginScreen from './components/LoginScreen'
import './App.css'

const STORAGE_KEY = 'it-notes-v3'
const DOCS_KEY = 'it-docs-v1'
const CAT_ORDER = ['setup', 'software', 'hardware', 'network', 'user-support', 'other']

function isLoggedIn() {
  return !!localStorage.getItem('it-notes-token')
}

export default function App() {
  const [authed, setAuthed] = useState(isLoggedIn)
  const [notes, setNotes] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(false)

  const [view, setView] = useState('logs')
  const [selectedDate, setSelectedDate] = useState(null)
  const [filters, setFilters] = useState({ category: 'all', tag: null })
  const [search, setSearch] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => localStorage.getItem('it-notes-theme') !== 'light')

  useEffect(() => {
    document.title = "NoteTakerIT";
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('it-notes-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // ── Load data from backend ────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [fetchedNotes, fetchedDocs] = await Promise.all([api.getNotes(), api.getDocs()])
      setNotes(fetchedNotes)
      setDocs(fetchedDocs)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Migrate localStorage data on first login ──────────
  const migrateLocalStorage = useCallback(async () => {
    const MIGRATED_KEY = 'it-notes-migrated'
    if (localStorage.getItem(MIGRATED_KEY)) return

    try {
      const rawNotes = localStorage.getItem(STORAGE_KEY)
      const rawDocs = localStorage.getItem(DOCS_KEY)
      const localNotes = rawNotes ? JSON.parse(rawNotes) : []
      const localDocs = rawDocs ? JSON.parse(rawDocs) : []

      if (localNotes.length || localDocs.length) {
        // Strip sample data marker — only migrate real user data
        const realNotes = localNotes.filter(n => !n.id?.startsWith('sample-'))
        const realDocs = localDocs.filter(d => !d.id?.startsWith('sample-'))

        if (realNotes.length || realDocs.length) {
          await api.migrate(realNotes, realDocs)
          console.log(`Migrated ${realNotes.length} notes, ${realDocs.length} docs from localStorage`)
        }
      }
    } catch (err) {
      console.error('Migration error (non-fatal):', err)
    }

    localStorage.setItem(MIGRATED_KEY, '1')
    // Clean up old storage keys after migration
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(DOCS_KEY)
  }, [])

  useEffect(() => {
    if (!authed) return
    migrateLocalStorage().then(() => loadData())
  }, [authed, loadData, migrateLocalStorage])

  const handleLogin = () => {
    setAuthed(true)
  }

  const handleLogout = () => {
    localStorage.removeItem('it-notes-token')
    setAuthed(false)
    setNotes([])
    setDocs([])
  }

  // ── Filtering ─────────────────────────────────────────
  const filteredNotes = notes.filter(note => {
    if (selectedDate && note.date !== selectedDate) return false
    if (filters.category !== 'all' && note.category !== filters.category) return false
    if (filters.tag && !note.tags.includes(filters.tag)) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      if (!note.title.toLowerCase().includes(q) &&
          !note.description.toLowerCase().includes(q) &&
          !note.tags.some(t => t.toLowerCase().includes(q)) &&
          !note.steps.some(s => s.text.toLowerCase().includes(q))) return false
    }
    return true
  })

  const filteredDocs = docs.filter(doc => {
    if (filters.category !== 'all' && doc.category !== filters.category) return false
    if (filters.tag && !doc.tags.includes(filters.tag)) return false
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

  const saveNote = async (data) => {
    const isDoc = view === 'docs'
    const record = {
      ...data,
      isDoc,
      id: editingNote?.id || `note-${Date.now()}`,
      createdAt: editingNote?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    try {
      if (editingNote) {
        const updated = await api.updateNote(record.id, record)
        if (isDoc) setDocs(prev => prev.map(d => d.id === record.id ? updated : d))
        else setNotes(prev => prev.map(n => n.id === record.id ? updated : n))
      } else {
        const created = await api.createNote(record)
        if (isDoc) setDocs(prev => [...prev, created])
        else setNotes(prev => [...prev, created])
      }
    } catch (err) {
      console.error('Save failed:', err)
    }
    setModalOpen(false)
  }

  const deleteNote = async (id) => {
    try {
      await api.deleteNote(id)
      if (view === 'docs') setDocs(prev => prev.filter(d => d.id !== id))
      else setNotes(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }

  const importData = async (importedNotes, importedDocs) => {
    try {
      await api.importAll(importedNotes, importedDocs)
      await loadData()
    } catch (err) {
      console.error('Import failed:', err)
    }
    setSettingsOpen(false)
  }

  const toggleStep = async (noteId, stepId) => {
    const updater = prev => prev.map(note => {
      if (note.id !== noteId) return note
      return { ...note, steps: note.steps.map(s => s.id === stepId ? { ...s, completed: !s.completed } : s), updatedAt: new Date().toISOString() }
    })

    const isDoc = view === 'docs'
    const list = isDoc ? docs : notes
    const updated = updater(list).find(n => n.id === noteId)
    if (!updated) return

    if (isDoc) setDocs(updater)
    else setNotes(updater)

    try {
      await api.updateNote(noteId, updated)
    } catch (err) {
      console.error('Toggle step failed:', err)
      // Revert on error
      if (isDoc) setDocs(prev => prev)
      else setNotes(prev => prev)
    }
  }

  // ── Grouped logs ──────────────────────────────────────
  const groupByDate = view === 'logs' && !selectedDate && !filters.tag
  const notesByDate = groupByDate
    ? [...new Set(filteredNotes.map(n => n.date))].sort((a, b) => b.localeCompare(a))
        .map(date => ({ date, notes: filteredNotes.filter(n => n.date === date) }))
    : null

  const handleTagClick = (tag) => {
    setFilters(prev => ({ ...prev, tag: prev.tag === tag ? null : tag }))
    setSelectedDate(null)
    setView('logs')
  }

  const mainTitle = view === 'docs' ? 'Documentation'
    : filters.tag ? `Tag: "${filters.tag}"`
    : selectedDate
      ? isToday(selectedDate) ? "Today's Logs"
        : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
      : filters.category !== 'all'
        ? `${filters.category.charAt(0).toUpperCase() + filters.category.slice(1).replace('-', ' ')} Logs`
        : search ? `Search: "${search}"` : 'All Logs'

  const totalCount = view === 'docs' ? filteredDocs.length : filteredNotes.length

  if (!authed) {
    return <LoginScreen onLogin={handleLogin} />
  }

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
          onOpenSettings={() => setSettingsOpen(true)}
        />
        <main className="main-content">
          <div className="main-header">
            <h2 className="main-title">
              {mainTitle}
              <span className="main-title-count">{totalCount}</span>
            </h2>
            {filters.tag && (
              <button className="tag-filter-chip" onClick={() => setFilters(prev => ({ ...prev, tag: null }))}>
                # {filters.tag} ✕
              </button>
            )}
          </div>

          {loading && (
            <div className="empty-state">
              <div className="empty-icon">◈</div>
              <p>Loading…</p>
            </div>
          )}

          {/* ── DOCS VIEW ── */}
          {!loading && view === 'docs' && (
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
                          onTagClick={handleTagClick}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ── LOGS VIEW ── */}
          {!loading && view === 'logs' && (
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
                          onTagClick={handleTagClick}
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
                    onTagClick={handleTagClick}
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
      {settingsOpen && (
        <SettingsModal notes={notes} docs={docs} onImport={importData}
          onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />
      )}
    </div>
  )
}
