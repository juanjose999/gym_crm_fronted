// Todas las llamadas a la API pasan por aquí.
// La API siempre responde { success, message, data }; devolvemos solo "data".

// URL de la API desde la variable de entorno VITE_API_URL (p. ej. en Vercel).
// Sin ella se usa "/api", que en desarrollo el proxy de Vite manda a localhost:8080.
const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

// ---------- Sesión (se guarda en localStorage) ----------

export function getSession() {
  return JSON.parse(localStorage.getItem('session'))
}

export function saveSession(session) {
  localStorage.setItem('session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('session')
}

// ---------- Petición genérica ----------

export async function api(path, method = 'GET', body = null, retry = true) {
  const session = getSession()

  const headers = { 'Content-Type': 'application/json' }
  if (session) {
    headers.Authorization = `Bearer ${session.tokens.accessToken}`
  }

  const res = await fetch(BASE_URL + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  // El access token dura 15 min: si caducó, pedimos uno nuevo y repetimos una vez
  if (res.status === 401 && session && retry) {
    const ok = await refreshTokens(session.tokens.refreshToken)
    if (ok) return api(path, method, body, false)

    clearSession()
    window.location.reload()
    return
  }

  // DELETE responde 204 sin cuerpo
  if (res.status === 204) return null

  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || `Error ${res.status}`)
  }
  return json.data
}

async function refreshTokens(refreshToken) {
  const res = await fetch(BASE_URL + '/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
  if (!res.ok) return false

  // Conservamos lo que ya había en sesión (p. ej. dashboardResponse) y pisamos lo nuevo
  const json = await res.json()
  saveSession({ ...getSession(), ...json.data })
  return true
}

// ---------- Utilidades de formato ----------

export function formatMoney(value) {
  return '$' + Number(value ?? 0).toLocaleString('es-CL')
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString('es-CL') : '-'
}
