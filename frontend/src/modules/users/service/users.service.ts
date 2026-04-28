import type {
  UserCreateModel,
  UserModel,
  UserPasswordResetModel,
  UserRoleUpdateModel,
  UsersSessionUserModel,
} from '../model/users.model'

const DEFAULT_API_URL = 'http://127.0.0.1:8000'
const AUTH_TOKEN_KEY = 'sigar.auth.token'
const AUTH_USER_KEY = 'sigar.auth.user'

function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, '')
}

function getAuthHeaders(): HeadersInit | undefined {
  const token = localStorage.getItem(AUTH_TOKEN_KEY)
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : undefined
}

export function getCurrentUsersUserService(): UsersSessionUserModel | null {
  const raw = localStorage.getItem(AUTH_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as UsersSessionUserModel
  } catch {
    return null
  }
}

export function logoutUsersService(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(AUTH_USER_KEY)
}

export async function getUsersService(): Promise<UserModel[]> {
  const response = await fetch(`${getApiBaseUrl()}/api/users`, {
    headers: getAuthHeaders(),
  })

  const payload = (await response.json().catch(() => null)) as UserModel[] | null
  if (!response.ok || !payload) {
    throw new Error('No se pudo cargar la lista de usuarios.')
  }

  return payload
}

export async function createUserService(payload: UserCreateModel): Promise<UserModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as UserModel | { detail?: string } | null
  if (!response.ok || !data || !('id' in data)) {
    const detail = data && 'detail' in data ? data.detail : undefined
    throw new Error(detail || 'No se pudo crear el usuario.')
  }

  return data
}

export async function updateUserRoleService(cedula: string, payload: UserRoleUpdateModel): Promise<UserModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${cedula}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as UserModel | { detail?: string } | null
  if (!response.ok || !data || !('id' in data)) {
    const detail = data && 'detail' in data ? data.detail : undefined
    throw new Error(detail || 'No se pudo actualizar el rol.')
  }

  return data
}

export async function resetUserPasswordService(cedula: string, payload: UserPasswordResetModel): Promise<UserModel> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${cedula}/reset-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(payload),
  })

  const data = (await response.json().catch(() => null)) as UserModel | { detail?: string } | null
  if (!response.ok || !data || !('id' in data)) {
    const detail = data && 'detail' in data ? data.detail : undefined
    throw new Error(detail || 'No se pudo resetear la contrasena.')
  }

  return data
}

export async function deleteUserService(cedula: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/api/users/${cedula}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new Error(payload?.detail || 'No se pudo eliminar el usuario.')
  }
}
