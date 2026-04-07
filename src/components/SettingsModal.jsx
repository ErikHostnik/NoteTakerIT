import { useRef, useEffect, useState } from 'react'

export default function SettingsModal({ notes, docs, onImport, onClose }) {
  const fileRef = useRef(null)
  const [status, setStatus] = useState(null) // { type: 'success'|'error', msg }

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleExport = () => {
    const payload = { version: 1, exportedAt: new Date().toISOString(), notes, docs }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `notetakerit-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setStatus({ type: 'success', msg: 'Backup downloaded.' })
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (!Array.isArray(data.notes) || !Array.isArray(data.docs)) {
          setStatus({ type: 'error', msg: 'Invalid backup file format.' })
          return
        }
        onImport(data.notes, data.docs)
        setStatus({ type: 'success', msg: `Imported ${data.notes.length} logs + ${data.docs.length} docs.` })
      } catch {
        setStatus({ type: 'error', msg: 'Could not parse file. Make sure it is a valid backup JSON.' })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal settings-modal">
        <div className="modal-header">
          <div className="modal-title-text">⚙ Settings</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <div className="settings-section-title">Data Backup</div>
            <div className="settings-section-desc">
              Export all your logs and documentation to a JSON file you can keep as a backup or transfer to another device.
            </div>

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Export backup</span>
                <span className="settings-row-sub">{notes.length} logs · {docs.length} docs</span>
              </div>
              <button className="btn btn-primary settings-btn" onClick={handleExport}>
                ↓ Download JSON
              </button>
            </div>

            <div className="settings-divider" />

            <div className="settings-row">
              <div className="settings-row-info">
                <span className="settings-row-label">Import backup</span>
                <span className="settings-row-sub">Replaces all current data</span>
              </div>
              <button className="btn btn-ghost settings-btn" onClick={() => fileRef.current?.click()}>
                ↑ Choose file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </div>

            {status && (
              <div className={`settings-status ${status.type}`}>
                {status.type === 'success' ? '✓' : '✕'} {status.msg}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <div style={{ flex: 1 }} />
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
