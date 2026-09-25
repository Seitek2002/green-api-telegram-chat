import { useCallback, useEffect, useState } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'

/** С какого размера очереди предлагать пропустить старые уведомления */
export const BACKLOG_THRESHOLD = 30
const REFRESH_MS = 5_000

export type BacklogState =
  | { status: 'none' }
  | { status: 'backlog'; count: number; error?: string }
  | { status: 'clearing'; count: number }

/**
 * Следит за накопившейся входящей очередью. После включения уведомлений или
 * долгого перерыва в ней могут быть тысячи событий по всему аккаунту, и новые
 * ответы окажутся в самом конце. Пользователь может пропустить старые.
 */
export function useQueueBacklog(api: GreenApi) {
  const [state, setState] = useState<BacklogState>({ status: 'none' })
  const [dismissed, setDismissed] = useState(false)
  const active = state.status !== 'none' && !dismissed

  // Первичная проверка при входе
  useEffect(() => {
    const controller = new AbortController()
    api
      .getWebhooksCount(controller.signal)
      .then(({ count }) => {
        if (count >= BACKLOG_THRESHOLD) setState({ status: 'backlog', count })
      })
      .catch(() => {
        // Метод необязателен для работы чата
      })
    return () => controller.abort()
  }, [api])

  // Пока очередь разбирается, обновляем счётчик
  useEffect(() => {
    if (!active) return
    const controller = new AbortController()
    const timer = setInterval(() => {
      api
        .getWebhooksCount(controller.signal)
        .then(({ count }) =>
          setState((prev) => {
            if (prev.status !== 'backlog') return prev
            return count < BACKLOG_THRESHOLD ? { status: 'none' } : { ...prev, count }
          }),
        )
        .catch(() => {})
    }, REFRESH_MS)
    return () => {
      clearInterval(timer)
      controller.abort()
    }
  }, [api, active])

  const clear = useCallback(async () => {
    if (state.status !== 'backlog') return
    const { count } = state
    setState({ status: 'clearing', count })
    try {
      const result = await api.clearWebhooksQueue()
      if (result.isCleared) {
        setState({ status: 'none' })
        return
      }
      const wait = result.leftTime ? ` Повторите через ${result.leftTime} с.` : ''
      setState({ status: 'backlog', count, error: `Не удалось очистить очередь: ${result.reason || 'ошибка'}.${wait}` })
    } catch (error) {
      const message = error instanceof GreenApiError ? error.message : 'Не удалось очистить очередь'
      setState({ status: 'backlog', count, error: message })
    }
  }, [api, state])

  const dismiss = useCallback(() => setDismissed(true), [])

  return { state: dismissed ? ({ status: 'none' } as const) : state, clear, dismiss }
}
