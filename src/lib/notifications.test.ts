import { describe, expect, it } from 'vitest'
import type { NotificationBody } from '../api/types'
import { parseNotification, UNSUPPORTED_MESSAGE_TEXT } from './notifications'

// Пример из документации GREEN-API MAX
const incomingText: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage: '1763115112345',
  senderData: {
    chatId: '10000000',
    chatName: 'Ходабрыш Пробешёлов',
    chatType: 'user',
    sender: '10000000',
    senderName: 'Ходабрыш Пробешёлов',
    senderPhoneNumber: 79876543210,
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет!' },
  },
}

describe('parseNotification', () => {
  it('разбирает входящее текстовое сообщение', () => {
    expect(parseNotification(incomingText)).toEqual({
      kind: 'message',
      message: {
        id: '1763115112345',
        chatId: '10000000',
        chatName: 'Ходабрыш Пробешёлов',
        senderPhone: '79876543210',
        text: 'Привет!',
        direction: 'in',
        timestamp: 1763115112000,
      },
    })
  })

  it('разбирает extendedTextMessage', () => {
    const result = parseNotification({
      ...incomingText,
      messageData: { typeMessage: 'extendedTextMessage', extendedTextMessageData: { text: 'Ссылка' } },
    })
    expect(result.kind === 'message' && result.message.text).toBe('Ссылка')
  })

  it('помечает исходящие сообщения с телефона и из API', () => {
    for (const typeWebhook of ['outgoingMessageReceived', 'outgoingAPIMessageReceived']) {
      const result = parseNotification({ ...incomingText, typeWebhook })
      expect(result.kind === 'message' && result.message.direction).toBe('out')
      expect(result.kind === 'message' && result.message.senderPhone).toBeUndefined()
    }
  })

  it('подставляет заглушку для нетекстовых сообщений', () => {
    const result = parseNotification({ ...incomingText, messageData: { typeMessage: 'imageMessage' } })
    expect(result.kind === 'message' && result.message.text).toBe(UNSUPPORTED_MESSAGE_TEXT)
  })

  it('разбирает статус исходящего сообщения', () => {
    expect(
      parseNotification({ typeWebhook: 'outgoingMessageStatus', chatId: '1', idMessage: 'abc', status: 'read' }),
    ).toEqual({ kind: 'status', chatId: '1', idMessage: 'abc', status: 'read' })
  })

  it('игнорирует служебные уведомления', () => {
    expect(parseNotification({ typeWebhook: 'stateInstanceChanged' })).toEqual({
      kind: 'ignored',
      typeWebhook: 'stateInstanceChanged',
    })
  })
})
