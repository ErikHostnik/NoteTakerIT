export default function Header({ search, onSearch, onCreateNote, onOpenReport, isDark, onToggleTheme }) {
  return (
    <header className="header">
      <div className="header-logo">
        <div className="header-logo-icon">◈</div>
        IT LOG
      </div>

      <div className="header-search">
        <span className="header-search-icon">⌕</span>
        <input
          type="text"
          placeholder="Search notes, titles, tags…"
          value={search}
          onChange={e => onSearch(e.target.value)}
        />
      </div>

      <div className="header-spacer" />

      <button className="header-btn header-btn-ghost" onClick={onOpenReport} title="Generate report">
        ⊞ Report
      </button>

      <button
        className="header-btn header-btn-ghost theme-toggle-btn"
        onClick={onToggleTheme}
        title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <span className="theme-toggle-icon">{isDark ? '☀' : '◐'}</span>
        {isDark ? 'Light' : 'Dark'}
      </button>

      <button className="header-btn header-btn-primary" onClick={onCreateNote}>
        + New Note
      </button>
    </header>
  )
}
