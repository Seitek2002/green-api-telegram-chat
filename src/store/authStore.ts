import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Credentials } from '../api/types'

interface AuthState {
  credentials: Credentials | null
  login: (credentials: Credentials) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      credentials: null,
      login: (credentials) => set({ credentials }),
      logout: () => set({ credentials: null }),
    }),
    { name: 'max-chat:auth' },
  ),
)
