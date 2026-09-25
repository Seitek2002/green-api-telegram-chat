import { useEffect, useState } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'
import { parseNotification } from '../lib/notifications'
import { useChatStore } from '../store/chatStore'

export type ConnectionStatus = 'connecting' | 'online' | 'error'

export interface PollingState {
  status: ConnectionStatus
  error: string | null
}

/** Сколько секунд сервер держит запрос, ожидая новое уведомление (5–60). */
const RECEIVE_TIMEOUT_SEC = 20
const MIN_RETRY_MS = 2_000
const MAX_RETRY_MS = 30_000

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

const isAbort = (error: unknown) => error instanceof DOMException && error.name === 'AbortError'

/**
 * Получение входящих уведомлений по технологии HTTP API:
 * receiveNotification (long polling) → обработка → deleteNotification.
 * https://green-api.com/v3/docs/api/receiving/technology-http-api/
 */
export function useNotificationPolling(api: GreenApi): PollingState {
  const [state, setState] = useState<PollingState>({ status: 'connecting', error: null })

  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const { receiveMessage, updateStatus } = useChatStore.getState()

    async function loop() {
      let retryDelay = MIN_RETRY_MS
      let checked = false

      while (!signal.aborted) {
        try {
          // Быстрая проверка состояния инстанса до первого долгого запроса
          if (!checked) {
            const { stateInstance } = await api.getStateInstance(signal)
            if (stateInstance !== 'authorized') {
              throw new GreenApiError(`Инстанс не авторизован (состояние: ${stateInstance})`, 0)
            }
            checked = true
            setState({ status: 'online', error: null })
          }

          const notification = await api.receiveNotification(RECEIVE_TIMEOUT_SEC, signal)
          setState((prev) => (prev.status === 'online' ? prev : { status: 'online', error: null }))
          retryDelay = MIN_RETRY_MS
          if (!notification) continue

          try {
            const event = parseNotification(notification.body)
            if (event.kind === 'message') receiveMessage(event.message)
            else if (event.kind === 'status') updateStatus(event.idMessage, event.status, event.chatId)
          } catch (error) {
            // Битое уведомление не должно блокировать очередь
            console.error('Не удалось обработать уведомление', notification, error)
          }

          // Удаляем уведомление из очереди, иначе сервер будет отдавать его снова
          await api.deleteNotification(notification.receiptId, signal)
        } catch (error) {
          if (isAbort(error) || signal.aborted) return
          const message = error instanceof GreenApiError ? error.message : 'Ошибка получения сообщений'
          setState({ status: 'error', error: message })
          await wait(retryDelay, signal)
          retryDelay = Math.min(retryDelay * 2, MAX_RETRY_MS)
        }
      }
    }

    void loop()
    return () => controller.abort()
  }, [api])

  return state
}
