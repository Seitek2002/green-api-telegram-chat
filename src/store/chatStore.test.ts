import { beforeEach, describe, expect, it } from 'vitest'
import type { ParsedMessage } from '../lib/notifications'
import { sortChats, useChatStore } from './chatStore'

const store = () => useChatStore.getState()

const incoming = (overrides: Partial<ParsedMessage> = {}): ParsedMessage => ({
  id: 'in-1',
  chatId: '10000000',
  chatName: 'Иван',
  senderPhone: '79991234567',
  text: 'Привет',
  direction: 'in',
  timestamp: 1_000,
  ...overrides,
})

describe('chatStore', () => {
  beforeEach(() => store().reset())

  it('создаёт чат по номеру и делает его активным', () => {
    store().openChat({ id: '10000000', phone: '79991234567' })
    expect(store().activeChatId).toBe('10000000')
    expect(store().chats['10000000']).toMatchObject({ name: '+7 999 123-45-67', unread: 0 })
  })

  it('проводит сообщение по жизненному циклу pending → sent → read', () => {
    store().openChat({ id: 'c1' })
    const localId = store().addPendingMessage('c1', 'Текст')
    expect(store().messages.c1[0]).toMatchObject({ id: localId, status: 'pending' })

    store().resolvePendingMessage('c1', localId, 'srv-1')
    expect(store().messages.c1[0]).toMatchObject({ id: 'srv-1', status: 'sent' })

    store().updateStatus('srv-1', 'read', 'c1')
    expect(store().messages.c1[0].status).toBe('read')

    // Более «старый» статус не откатывает прочитанное сообщение
    store().updateStatus('srv-1', 'delivered', 'c1')
    expect(store().messages.c1[0].status).toBe('read')
  })

  it('не дублирует сообщение, если уведомление пришло раньше ответа sendMessage', () => {
    store().openChat({ id: 'c1' })
    const localId = store().addPendingMessage('c1', 'Текст')
    store().receiveMessage(incoming({ id: 'srv-1', chatId: 'c1', direction: 'out', senderPhone: undefined }))
    store().resolvePendingMessage('c1', localId, 'srv-1')
    expect(store().messages.c1.map((m) => m.id)).toEqual(['srv-1'])
  })

  it('помечает сообщение как неотправленное с причиной', () => {
    store().openChat({ id: 'c1' })
    const localId = store().addPendingMessage('c1', 'Текст')
    store().failPendingMessage('c1', localId, 'Ошибка сети')
    expect(store().messages.c1[0]).toMatchObject({ status: 'failed', error: 'Ошибка сети' })
  })

  it('создаёт новый чат для входящего сообщения и считает непрочитанные', () => {
    store().receiveMessage(incoming())
    store().receiveMessage(incoming({ id: 'in-2', timestamp: 2_000 }))
    expect(store().chats['10000000']).toMatchObject({ name: 'Иван', unread: 2, updatedAt: 2_000 })

    store().setActiveChat('10000000')
    expect(store().chats['10000000'].unread).toBe(0)
  })

  it('игнорирует повторное уведомление с тем же idMessage', () => {
    store().receiveMessage(incoming())
    store().receiveMessage(incoming())
    expect(store().messages['10000000']).toHaveLength(1)
  })

  it('переносит чат, созданный по телефону, на chatId из Telegram', () => {
    store().openChat({ id: '79991234567@c.us', phone: '79991234567' })
    store().addPendingMessage('79991234567@c.us', 'Привет')
    store().receiveMessage(incoming())

    expect(store().chats['79991234567@c.us']).toBeUndefined()
    expect(store().activeChatId).toBe('10000000')
    expect(store().messages['10000000'].map((m) => m.text)).toEqual(['Привет', 'Привет'])
    expect(store().chats['10000000'].unread).toBe(0)
  })

  it('сбрасывает историю при входе в другой инстанс', () => {
    store().bindInstance('1101')
    store().receiveMessage(incoming())
    store().bindInstance('1101')
    expect(Object.keys(store().chats)).toHaveLength(1)
    store().bindInstance('3100')
    expect(store().chats).toEqual({})
  })

  it('sortChats сортирует по последней активности', () => {
    store().receiveMessage(incoming({ id: 'a', chatId: 'old', senderPhone: undefined, timestamp: 1 }))
    store().receiveMessage(incoming({ id: 'b', chatId: 'new', senderPhone: undefined, timestamp: 5 }))
    expect(sortChats(store().chats).map((c) => c.id)).toEqual(['new', 'old'])
  })
})

describe('chatStore: имя чата', () => {
  beforeEach(() => store().reset())

  it('заменяет номер на имя из Telegram при первом ответе', () => {
    store().openChat({ id: '10000000', phone: '79991234567' })
    store().receiveMessage(incoming())
    expect(store().chats['10000000'].name).toBe('Иван')
  })
})
