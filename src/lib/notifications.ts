import type { MessageData, NotificationBody } from '../api/types'
import type { MessageDirection, MessageStatus } from '../store/types'

export interface ParsedMessage {
  id: string
  chatId: string
  chatName?: string
  senderPhone?: string
  text: string
  direction: MessageDirection
  timestamp: number
}

export type ParsedNotification =
  | { kind: 'message'; message: ParsedMessage }
  | { kind: 'status'; chatId?: string; idMessage: string; status: MessageStatus }
  | { kind: 'ignored'; typeWebhook: string }

const MESSAGE_DIRECTIONS: Record<string, MessageDirection> = {
  incomingMessageReceived: 'in',
  // Сообщение отправлено с телефона
  outgoingMessageReceived: 'out',
  // Сообщение отправлено через API (в том числе этим приложением)
  outgoingAPIMessageReceived: 'out',
}

const STATUSES: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
  noAccount: 'failed',
  notInGroup: 'failed',
}

export const UNSUPPORTED_MESSAGE_TEXT = 'Сообщение этого типа не поддерживается'

export function extractText(data: MessageData | undefined): string {
  if (!data) return UNSUPPORTED_MESSAGE_TEXT
  const text = data.textMessageData?.textMessage ?? data.extendedTextMessageData?.text
  return typeof text === 'string' ? text : UNSUPPORTED_MESSAGE_TEXT
}

/**
 * Преобразует тело уведомления GREEN-API в событие для стора.
 * Функция чистая: не обращается к сети и состоянию, поэтому легко тестируется.
 */
export function parseNotification(body: NotificationBody): ParsedNotification {
  const direction = MESSAGE_DIRECTIONS[body.typeWebhook]

  if (direction && body.senderData?.chatId && body.idMessage) {
    const { senderData } = body
    const phone = senderData.senderPhoneNumber
    return {
      kind: 'message',
      message: {
        id: body.idMessage,
        chatId: senderData.chatId,
        chatName: senderData.chatName || senderData.senderContactName || senderData.senderName || undefined,
        senderPhone: direction === 'in' && phone ? String(phone) : undefined,
        text: extractText(body.messageData),
        direction,
        timestamp: (body.timestamp ?? Date.now() / 1000) * 1000,
      },
    }
  }

  if (body.typeWebhook === 'outgoingMessageStatus' && body.idMessage && body.status) {
    const status = STATUSES[body.status]
    if (status) return { kind: 'status', chatId: body.chatId, idMessage: body.idMessage, status }
  }

  return { kind: 'ignored', typeWebhook: body.typeWebhook }
}
