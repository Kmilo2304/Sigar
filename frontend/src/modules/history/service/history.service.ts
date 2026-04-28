import type {
  ComparativeHistoryResponseModel,
  HistoryGranularity,
  HistoryUserModel,
} from '../model/history.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'
const AUTH_USER_KEY = 'sigar.auth.user'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

export function getCurrentHistoryUserService(): HistoryUserModel | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as HistoryUserModel
  } catch {
    return null
  }
}

export function logoutHistoryService(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function getComparativeHistoryService(params: {
  granularity: HistoryGranularity
  fromDate: string
  toDate: string
}): Promise<ComparativeHistoryResponseModel> {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)

  const query = new URLSearchParams({
    granularity: params.granularity,
    from_date: params.fromDate,
    to_date: params.toDate,
  })

  const response = await fetch(`${getApiBaseUrl()}/api/history/comparative?${query.toString()}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  })

  const payload = (await response.json().catch(() => null)) as ComparativeHistoryResponseModel | null

  if (!response.ok || !payload) {
    throw new Error('No se pudo cargar el panel histórico.')
  }

  return payload
}
