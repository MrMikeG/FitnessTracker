export type AuthUser = { id: string; email?: string }
export type AuthSession = { accessToken: string; refreshToken?: string; user: AuthUser }

const storageKey = 'pulse-supabase-session-v1'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

function configured() {
  return Boolean(url && key)
}

async function request<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  if (!configured()) throw new Error('Supabase is not configured.')
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { apikey: key!, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers }
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { msg?: string; message?: string }
    throw new Error(body.msg || body.message || 'Something went wrong. Please try again.')
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>
}

async function getUser(accessToken: string): Promise<AuthUser> {
  return request<AuthUser>('/auth/v1/user', { method: 'GET' }, accessToken)
}

export const supabase = {
  isConfigured: configured,
  async restoreSession(): Promise<AuthSession | null> {
    if (!configured()) return null
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const accessToken = hash.get('access_token')
    const refreshToken = hash.get('refresh_token') ?? undefined
    if (accessToken) {
      const user = await getUser(accessToken)
      const session = { accessToken, refreshToken, user }
      window.localStorage.setItem(storageKey, JSON.stringify(session))
      window.history.replaceState({}, '', window.location.pathname)
      return session
    }
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return null
    try {
      const session = JSON.parse(saved) as AuthSession
      session.user = await getUser(session.accessToken)
      return session
    } catch {
      window.localStorage.removeItem(storageKey)
      return null
    }
  },
  async sendMagicLink(email: string, redirectTo: string) {
    return request('/auth/v1/otp', { method: 'POST', body: JSON.stringify({ email, create_user: true, options: { emailRedirectTo: redirectTo } }) })
  },
  async getProgress(userId: string, accessToken: string) {
    const rows = await request<Array<{ data: unknown }>>(`/rest/v1/user_progress?user_id=eq.${encodeURIComponent(userId)}&select=data`, { method: 'GET' }, accessToken)
    return rows[0]?.data ?? null
  },
  async saveProgress(userId: string, data: unknown, accessToken: string) {
    return request('/rest/v1/user_progress?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ user_id: userId, data }) }, accessToken)
  },
  async signOut(accessToken: string) {
    await request('/auth/v1/logout', { method: 'POST' }, accessToken)
    window.localStorage.removeItem(storageKey)
  }
}
