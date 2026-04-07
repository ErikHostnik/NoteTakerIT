export const genId = () => `id-${Date.now()}-${Math.floor(Math.random() * 9999)}`

export const formatDate = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const formatDateShort = (dateStr) => {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export const isToday = (dateStr) => dateStr === new Date().toISOString().split('T')[0]

export const isThisWeek = (dateStr) => {
  const today = new Date()
  const date = new Date(dateStr + 'T00:00:00')
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return date >= weekStart && date <= today
}

export const parseArrowFormat = (text) => {
  const lines = text.split('\n').filter(l => l.trim())
  return lines.map(line => {
    const match = line.match(/^(-+>?)\s*(.+)/)
    if (match) {
      const dashCount = (match[1].match(/-/g) || []).length
      const level = Math.min(Math.max(0, dashCount - 4), 2)
      return { id: genId(), text: match[2].trim(), level, completed: false }
    }
    return { id: genId(), text: line.trim(), level: 0, completed: false }
  })
}

export const generateReport = (notes) => {
  if (!notes.length) return 'No notes to report.'

  const byDate = {}
  notes.forEach(n => {
    if (!byDate[n.date]) byDate[n.date] = []
    byDate[n.date].push(n)
  })

  const sorted = Object.keys(byDate).sort((a, b) => b.localeCompare(a))
  const lines = ['IT INTERNSHIP — WORK LOG', `Generated: ${formatDate(new Date().toISOString().split('T')[0])}`, '']

  sorted.forEach(date => {
    lines.push('═'.repeat(52))
    lines.push(formatDate(date).toUpperCase())
    lines.push('═'.repeat(52))
    lines.push('')

    byDate[date].forEach(note => {
      lines.push(`[${note.category.toUpperCase().replace('-', ' ')}]  ${note.title}`)
      lines.push(`Status: ${note.status.replace('-', ' ')} | Priority: ${note.priority}`)
      if (note.description) lines.push(`\n${note.description}`)
      if (note.steps.length) {
        lines.push('\nSteps:')
        note.steps.forEach(step => {
          const indent = '  '.repeat(step.level + 1)
          const mark = step.completed ? '[✓]' : '[ ]'
          lines.push(`${indent}${mark} ${step.text}`)
        })
      }
      if (note.tags.length) lines.push(`\nTags: ${note.tags.join(', ')}`)
      lines.push('\n' + '─'.repeat(52) + '\n')
    })
  })

  return lines.join('\n')
}
