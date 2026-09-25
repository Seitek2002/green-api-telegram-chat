import { useMemo } from 'react'
import { createGreenApi, type GreenApi } from '../api/greenApi'
import { useAuthStore } from '../store/authStore'

/** Клиент GREEN-API для текущих учётных данных. Используется только после входа. */
export function useGreenApi(): GreenApi {
  const credentials = useAuthStore((state) => state.credentials)
  if (!credentials) throw new Error('useGreenApi вызван без учётных данных')
  return useMemo(() => createGreenApi(credentials), [credentials])
}
