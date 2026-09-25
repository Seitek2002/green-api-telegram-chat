import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ParsedMessage } from '../lib/notifications'
import { formatPhone } from '../lib/phone'
import type { Chat, Message, MessageStatus } from './types'

interface ChatState {
  chats: Record<string, Chat>
  messages: Record<string, Message[]>
  activeChatId: string | null
  /** idInstance, которому принадлежит сохранённая история */
  instanceId: string | null

  bindInstance: (idInstance: string) => void
  openChat: (chat: { id: string; name?: string; phone?: string }) => void
  setActiveChat: (chatId: string | null) => void
  addPendingMessage: (chatId: string, text: string) => string
  resolvePendingMessage: (chatId: string, localId: string, idMessage: string) => void
  failPendingMessage: (chatId: string, localId: string, error: string) => void
  removeMessage: (chatId: string, messageId: string) => void
  receiveMessage: (message: ParsedMessage) => void
  updateStatus: (idMessage: string, status: MessageStatus, chatId?: string) => void
  reset: () => void
}

const STATUS_RANK: Record<MessageStatus, number> = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 }

let localCounter = 0
const createLocalId = () => `local-${Date.now()}-${++localCounter}`

function upsertChat(chats: Record<string, Chat>, chat: Chat): Record<string, Chat> {
  return { ...chats, [chat.id]: chat }
}

function isPlaceholderName(chat: Chat): boolean {
  return chat.name === chat.id || (chat.phone !== undefined && chat.name === formatPhone(chat.phone))
}

function sortByTime(list: Message[]): Message[] {
  return [...list].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Находит чат для входящего сообщения. В MAX ответ приходит с числовым chatId,
 * а чат мог быть создан по номеру телефона (phone@c.us), поэтому
 * дополнительно сверяемся с номером отправителя.
 */
function findChatId(state: ChatState, message: ParsedMessage): string | undefined {
  if (state.chats[message.chatId]) return message.chatId
  if (!message.senderPhone) return undefined
  return Object.values(state.chats).find((chat) => chat.phone === message.senderPhone)?.id
}

const initialState = {
  chats: {} as Record<string, Chat>,
  messages: {} as Record<string, Message[]>,
  activeChatId: null as string | null,
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      ...initialState,
      instanceId: null,

      bindInstance: (idInstance) =>
        set((state) => (state.instanceId === idInstance ? state : { ...initialState, instanceId: idInstance })),

      openChat: ({ id, name, phone }) =>
        set((state) => {
          const existing = state.chats[id]
          const chat: Chat = existing
            ? { ...existing, unread: 0, phone: existing.phone ?? phone }
            : {
                id,
                name: name || (phone ? formatPhone(phone) : id),
                phone,
                unread: 0,
                updatedAt: Date.now(),
              }
          return { chats: upsertChat(state.chats, chat), activeChatId: id }
        }),

      setActiveChat: (chatId) =>
        set((state) => {
          const chat = chatId ? state.chats[chatId] : undefined
          return {
            activeChatId: chatId,
            chats: chat ? upsertChat(state.chats, { ...chat, unread: 0 }) : state.chats,
          }
        }),

      addPendingMessage: (chatId, text) => {
        const id = createLocalId()
        const message: Message = { id, chatId, text, direction: 'out', timestamp: Date.now(), status: 'pending' }
        set((state) => {
          const chat = state.chats[chatId]
          return {
            messages: { ...state.messages, [chatId]: [...(state.messages[chatId] ?? []), message] },
            chats: chat ? upsertChat(state.chats, { ...chat, updatedAt: message.timestamp }) : state.chats,
          }
        })
        return id
      },

      resolvePendingMessage: (chatId, localId, idMessage) =>
        set((state) => {
          const list = state.messages[chatId] ?? []
          // Уведомление outgoingAPIMessageReceived могло прийти раньше ответа sendMessage
          const alreadyReceived = list.some((m) => m.id === idMessage)
          const next = alreadyReceived
            ? list.filter((m) => m.id !== localId)
            : list.map((m) =>
                m.id === localId ? { ...m, id: idMessage, status: 'sent' as const, error: undefined } : m,
              )
          return { messages: { ...state.messages, [chatId]: next } }
        }),

      failPendingMessage: (chatId, localId, error) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] ?? []).map((m) =>
              m.id === localId ? { ...m, status: 'failed' as const, error } : m,
            ),
          },
        })),

      removeMessage: (chatId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [chatId]: (state.messages[chatId] ?? []).filter((m) => m.id !== messageId),
          },
        })),

      receiveMessage: (incoming) =>
        set((state) => {
          const knownChatId = findChatId(state, incoming)
          let chats = state.chats
          let messages = state.messages
          let activeChatId = state.activeChatId

          // Чат создан по телефону, а MAX прислал настоящий chatId — переносим историю
          if (knownChatId && knownChatId !== incoming.chatId) {
            const { [knownChatId]: oldChat, ...restChats } = chats
            const { [knownChatId]: oldMessages = [], ...restMessages } = messages
            chats = { ...restChats, [incoming.chatId]: { ...oldChat, id: incoming.chatId } }
            messages = {
              ...restMessages,
              [incoming.chatId]: oldMessages.map((m) => ({ ...m, chatId: incoming.chatId })),
            }
            if (activeChatId === knownChatId) activeChatId = incoming.chatId
          }

          const chatId = incoming.chatId
          const list = messages[chatId] ?? []
          if (list.some((m) => m.id === incoming.id)) return { chats, messages, activeChatId }

          const isActive = activeChatId === chatId
          const isUnread = incoming.direction === 'in' && !isActive
          const current = chats[chatId]
          const chat: Chat = current
            ? {
                ...current,
                // Чат назван по номеру — заменяем на имя из профиля MAX, когда оно стало известно
                name:
                  incoming.direction === 'in' && incoming.chatName && isPlaceholderName(current)
                    ? incoming.chatName
                    : current.name,
                phone: current.phone ?? incoming.senderPhone,
                unread: current.unread + (isUnread ? 1 : 0),
                updatedAt: Math.max(current.updatedAt, incoming.timestamp),
              }
            : {
                id: chatId,
                name: incoming.chatName || (incoming.senderPhone ? formatPhone(incoming.senderPhone) : chatId),
                phone: incoming.senderPhone,
                unread: isUnread ? 1 : 0,
                updatedAt: incoming.timestamp,
              }

          const message: Message = {
            id: incoming.id,
            chatId,
            text: incoming.text,
            direction: incoming.direction,
            timestamp: incoming.timestamp,
            status: incoming.direction === 'out' ? 'sent' : undefined,
          }

          return {
            activeChatId,
            chats: upsertChat(chats, chat),
            messages: { ...messages, [chatId]: sortByTime([...list, message]) },
          }
        }),

      updateStatus: (idMessage, status, chatId) =>
        set((state) => {
          const targetIds = chatId && state.messages[chatId] ? [chatId] : Object.keys(state.messages)
          for (const id of targetIds) {
            const list = state.messages[id]
            const index = list.findIndex((m) => m.id === idMessage)
            if (index === -1) continue
            const current = list[index]
            if (current.status && STATUS_RANK[current.status] >= STATUS_RANK[status]) return state
            const next = [...list]
            next[index] = { ...current, status }
            return { messages: { ...state.messages, [id]: next } }
          }
          return state
        }),

      reset: () => set({ ...initialState, instanceId: null }),
    }),
    {
      name: 'max-chat:chats',
      // Сообщения, отправка которых не завершилась до перезагрузки, помечаем как неотправленные
      partialize: ({ chats, messages, instanceId }) => ({
        instanceId,
        chats,
        messages: Object.fromEntries(
          Object.entries(messages).map(([id, list]) => [
            id,
            list.map((m) => (m.status === 'pending' ? { ...m, status: 'failed' as const, error: 'Отправка прервана' } : m)),
          ]),
        ),
      }),
    },
  ),
)

/** Чаты, отсортированные по времени последней активности. */
export const sortChats = (chats: Record<string, Chat>) =>
  Object.values(chats).sort((a, b) => b.updatedAt - a.updatedAt)
