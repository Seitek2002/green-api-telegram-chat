export type MessageDirection = 'in' | 'out'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  id: string
  chatId: string
  text: string
  direction: MessageDirection
  /** Время в миллисекундах */
  timestamp: number
  /** Статус доставки, только для исходящих */
  status?: MessageStatus
  error?: string
}

export interface Chat {
  /** chatId в GREEN-API (id пользователя Telegram или телефон@c.us) */
  id: string
  name: string
  /** Номер телефона в формате цифр, если чат создан по номеру */
  phone?: string
  unread: number
  updatedAt: number
}
