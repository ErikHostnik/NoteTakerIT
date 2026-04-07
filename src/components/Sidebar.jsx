import { useState, useMemo } from 'react'
import { CATEGORIES } from '../constants'
import { formatDateShort, isToday } from '../utils'

const CAT_COLOR = {
  hardware: 'var(--amber)', software: 'var(--blue)', network: 'var(--teal)',
  'user-support': 'var(--purple)', setup: 'var(--green)', other: 'var(--gray)',
}

function getMonthKey(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  return new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function Sidebar({ notes, selectedDate, onSelectDate, filters, onFiltersChange, view, onSetView, onOpenSettings }) {
  const logNotes = notes.filter(n => !n.isDoc)
  const uniqueDates = [...new Set(logNotes.map(n => n.date))].sort((a, b) => b.localeCompare(a))

  // Group dates by month, newest month first
  const monthGroups = useMemo(() => {
    const map = {}
    uniqueDates.forEach(date => {
      const key = getMonthKey(date)
      if (!map[key]) map[key] = []
      map[key].push(date)
    })
    return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]))
  }, [uniqueDates])

  // Default: expand the most recent month (first in sorted list)
  const [expandedMonths, setExpandedMonths] = useState(() => {
    if (monthGroups.length > 0) return new Set([monthGroups[0][0]])
    return new Set()
  })

  const toggleMonth = (key) => {
    setExpandedMonths(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const countFor = (val) => logNotes.filter(n => n.category === val).length
  const setCategory = (val) => onFiltersChange(prev => ({ ...prev, category: val }))

  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">

        {/* Quick view */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Quick View</div>

          <button
            className={`sidebar-item ${view === 'logs' && !selectedDate && filters.category === 'all' ? 'active' : ''}`}
            onClick={() => { onSetView('logs'); onFiltersChange({ category: 'all' }) }}
          >
            <span style={{ fontSize: 13 }}>◈</span>
            All Logs
            <span className="sidebar-item-count">{logNotes.length}</span>
          </button>

          <button
            className={`sidebar-item ${view === 'logs' && selectedDate === new Date().toISOString().split('T')[0] ? 'active' : ''}`}
            onClick={() => { onSetView('logs'); onSelectDate(new Date().toISOString().split('T')[0]) }}
          >
            <span style={{ fontSize: 13 }}>◎</span>
            Today
            <span className="sidebar-item-count">{logNotes.filter(n => isToday(n.date)).length}</span>
          </button>

          <button
            className={`sidebar-item ${view === 'docs' ? 'active' : ''}`}
            onClick={() => onSetView('docs')}
          >
            <span style={{ fontSize: 13 }}>⊟</span>
            Documentation
          </button>
        </div>

        <div className="sidebar-divider" />

        {/* Dates grouped by month */}
        {view !== 'docs' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">By Date</div>

            {monthGroups.map(([monthKey, dates]) => {
              const isExpanded = expandedMonths.has(monthKey)
              const monthCount = dates.reduce((sum, d) => sum + logNotes.filter(n => n.date === d).length, 0)
              const hasSelectedDate = dates.includes(selectedDate)

              return (
                <div key={monthKey} className="month-group">
                  {/* Month header */}
                  <button
                    className={`month-header ${hasSelectedDate ? 'month-header-active' : ''}`}
                    onClick={() => toggleMonth(monthKey)}
                  >
                    <span className={`month-chevron ${isExpanded ? 'expanded' : ''}`}>›</span>
                    <span className="month-label">{formatMonthLabel(monthKey)}</span>
                    <span className="sidebar-item-count">{monthCount}</span>
                  </button>

                  {/* Dates inside month */}
                  {isExpanded && (
                    <div className="month-dates">
                      {dates.map(date => {
                        const count = logNotes.filter(n => n.date === date).length
                        const today = isToday(date)
                        return (
                          <button
                            key={date}
                            className={`sidebar-item month-date-item ${selectedDate === date ? 'active' : ''}`}
                            onClick={() => onSelectDate(selectedDate === date ? null : date)}
                          >
                            <span className="sidebar-item-dot"
                              style={{ background: today ? 'var(--blue)' : 'var(--text-3)' }} />
                            <span>{today ? 'Today' : formatDateShort(date)}</span>
                            <span className="sidebar-item-count">{count}</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}

            <div className="sidebar-divider" />
          </div>
        )}

        {/* Category filter */}
        <div className="sidebar-section">
          <div className="sidebar-section-title">Category</div>
          <button
            className={`sidebar-filter-pill ${filters.category === 'all' ? 'active' : ''}`}
            onClick={() => setCategory('all')}
          >
            <span className="sidebar-filter-dot" style={{ background: 'var(--text-3)' }} />
            All
          </button>
          {Object.entries(CATEGORIES).map(([key, { label }]) => (
            <button
              key={key}
              className={`sidebar-filter-pill ${filters.category === key ? 'active' : ''}`}
              onClick={() => setCategory(key)}
            >
              <span className="sidebar-filter-dot" style={{ background: CAT_COLOR[key] }} />
              {label}
              {view !== 'docs' && countFor(key) > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-3)' }}>{countFor(key)}</span>
              )}
            </button>
          ))}
        </div>

      </div>

      <div className="sidebar-footer">
        <button className="sidebar-settings-btn" onClick={onOpenSettings}>
          <span>⚙</span>
          Settings
        </button>
      </div>
    </aside>
  )
}
