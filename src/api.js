const BASE = '/api'

function getToken() {
  return localStorage.getItem('it-notes-token')
}

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`
  }
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined
  })
  if (res.status === 401) {
    localStorage.removeItem('it-notes-token')
    window.location.reload()
    return
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Auth
  login: (username, password) =>
    fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(async res => {
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Login failed')
      return data
    }),

  // Notes & Docs
  getNotes: () => request('GET', '/notes'),
  getDocs:  () => request('GET', '/docs'),
  createNote: (note) => request('POST', '/notes', note),
  updateNote: (id, note) => request('PUT', `/notes/${id}`, note),
  deleteNote: (id) => request('DELETE', `/notes/${id}`),

  // Bulk migrate localStorage data on first login (insert only, no overwrite)
  migrate: (notes, docs) => request('POST', '/migrate', { notes, docs }),

  // Full import from backup (replaces all data)
  importAll: (notes, docs) => request('POST', '/import', { notes, docs })
}
