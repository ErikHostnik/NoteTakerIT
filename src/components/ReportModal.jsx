import { useState, useEffect } from 'react'
import { generateReport } from '../utils'

export default function ReportModal({ notes, onClose }) {
  const [copied, setCopied] = useState(false)
  const text = generateReport(notes)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `IT-WorkLog-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 720 }}>
        <div className="modal-header">
          <div className="modal-title-text">⊞ Internship Work Log Report</div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>
            All notes formatted for your internship report. Copy or download as plain text.
          </p>
          <pre className="report-output">{text}</pre>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <div style={{ flex: 1 }} />
          {copied && (
            <span className="report-copy-notice">✓ Copied to clipboard!</span>
          )}
          <button className="btn btn-ghost" onClick={handleDownload}>
            ↓ Download .txt
          </button>
          <button className="btn btn-primary" onClick={handleCopy}>
            ⎘ Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
