import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  GetStateInstanceResponse,
  InstanceSettings,
  ReceivedNotification,
  SendMessageRequest,
  SendMessageResponse,
} from './types'

export class GreenApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'GreenApiError'
    this.status = status
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number>
  /** Дополнительный сегмент пути после токена (например receiptId) */
  suffix?: string | number
  signal?: AbortSignal
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос',
  401: 'Неверный idInstance или apiTokenInstance',
  403: 'Доступ запрещён: проверьте idInstance и apiTokenInstance',
  429: 'Слишком много запросов, попробуйте позже',
  466: 'Превышен лимит тарифа',
}

function describeError(status: number, payload: string): string {
  let reason = ''
  try {
    const json = JSON.parse(payload) as { message?: string }
    reason = json.message ?? ''
  } catch {
    reason = payload.trim()
  }
  const base = STATUS_MESSAGES[status] ?? (status >= 500 ? 'Сервер GREEN-API недоступен' : 'Ошибка запроса')
  return reason ? `${base}: ${reason}` : `${base} (HTTP ${status})`
}

/** Хост API по умолчанию вычисляется из первых четырёх цифр idInstance. */
export function getDefaultApiUrl(idInstance: string): string {
  const prefix = idInstance.trim().slice(0, 4)
  return /^\d{4}$/.test(prefix) ? `https://${prefix}.api.green-api.com` : 'https://api.green-api.com'
}

/**
 * Минимальный клиент GREEN-API: только методы, необходимые для текстового чата.
 * Документация: https://green-api.com/v3/docs/api/
 */
export function createGreenApi(credentials: Credentials) {
  const baseUrl = credentials.apiUrl.trim().replace(/\/+$/, '')
  const id = credentials.idInstance.trim()
  const token = credentials.apiTokenInstance.trim()

  async function request<T>(method: string, options: RequestOptions = {}): Promise<T> {
    const suffix = options.suffix !== undefined ? `/${options.suffix}` : ''
    const url = new URL(`${baseUrl}/waInstance${id}/${method}/${token}${suffix}`)
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, String(value))
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET',
        headers: options.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error
      throw new GreenApiError('Не удалось подключиться к GREEN-API. Проверьте интернет и адрес API', 0)
    }

    const text = await response.text()
    if (!response.ok) throw new GreenApiError(describeError(response.status, text), response.status)
    // receiveNotification возвращает пустое тело (или null), если очередь пуста
    return (text ? JSON.parse(text) : null) as T
  }

  return {
    getStateInstance: (signal?: AbortSignal) =>
      request<GetStateInstanceResponse>('getStateInstance', { signal }),

    getSettings: (signal?: AbortSignal) => request<InstanceSettings>('getSettings', { signal }),

    setSettings: (settings: InstanceSettings) =>
      request<{ saveSettings: boolean }>('setSettings', { method: 'POST', body: settings }),

    /** Количество уведомлений во входящей очереди */
    getWebhooksCount: (signal?: AbortSignal) => request<{ count: number }>('getWebhooksCount', { signal }),

    /** Очистка входящей очереди (старые уведомления удаляются без обработки) */
    clearWebhooksQueue: () =>
      request<{ isCleared: boolean; reason?: string; leftTime?: number }>('clearWebhooksQueue', {
        method: 'DELETE',
      }),

    /** Поиск аккаунта Telegram по номеру телефона или username */
    checkAccount: (target: { phoneNumber: string } | { username: string }) =>
      request<CheckAccountResponse>('checkAccount', {
        method: 'POST',
        body: 'phoneNumber' in target ? { phoneNumber: Number(target.phoneNumber) } : target,
      }),

    sendMessage: (payload: SendMessageRequest) =>
      request<SendMessageResponse>('sendMessage', { method: 'POST', body: payload }),

    receiveNotification: (receiveTimeout: number, signal?: AbortSignal) =>
      request<ReceivedNotification | null>('receiveNotification', {
        query: { receiveTimeout },
        signal,
      }),

    deleteNotification: (receiptId: number, signal?: AbortSignal) =>
      request<DeleteNotificationResponse>('deleteNotification', {
        method: 'DELETE',
        suffix: receiptId,
        signal,
      }),
  }
}

export type GreenApi = ReturnType<typeof createGreenApi>
