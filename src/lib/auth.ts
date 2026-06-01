import { Store } from '@tanstack/store'
import type { User } from '#/types/user'

interface AuthState {
  token: string | null
  user: User | null
}

export const TOKEN_KEY = 'uitie_token'
export const USER_KEY = 'uitie_user'

function loadFromStorage(): AuthState {
  if (typeof window === 'undefined') {
    return { token: null, user: null }
  }
  try {
    const token = localStorage.getItem(TOKEN_KEY)
    const user = localStorage.getItem(USER_KEY)
    return {
      token,
      user: user ? (JSON.parse(user) as User) : null,
    }
  } catch {
    return { token: null, user: null }
  }
}

export const authStore = new Store<AuthState>(loadFromStorage())

export function getToken(): string | null {
  return authStore.state.token
}

export function getUser(): User | null {
  return authStore.state.user
}

export function isAuthenticated(): boolean {
  return authStore.state.token !== null
}

export function isAdmin(): boolean {
  const role = authStore.state.user?.role
  return role === 'Admin' || role === 'Super Admin'
}

export function isSuperAdmin(): boolean {
  return authStore.state.user?.role === 'Super Admin'
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  authStore.setState(() => ({ token, user }))
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  authStore.setState(() => ({ token: null, user: null }))
}
