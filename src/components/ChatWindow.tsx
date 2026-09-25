import { useCallback } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'
import { formatPhone } from '../lib/phone'
import { useChatStore } from '../store/chatStore'
import type { Chat, Message } from '../store/types'
import { Avatar } from './Avatar'
import { Composer } from './Composer'
import { BackIcon } from './icons'
import { MessageList } from './MessageList'
import styles from './ChatWindow.module.css'

interface ChatWindowProps {
  api: GreenApi
  chat: Chat
}

const EMPTY: Message[] = []

export function ChatWindow({ api, chat }: ChatWindowProps) {
  const messages = useChatStore((state) => state.messages[chat.id] ?? EMPTY)
  const setActiveChat = useChatStore((state) => state.setActiveChat)

  const send = useCallback(
    async (text: string) => {
      const { addPendingMessage, resolvePendingMessage, failPendingMessage } = useChatStore.getState()
      const localId = addPendingMessage(chat.id, text)
      try {
        const { idMessage } = await api.sendMessage({ chatId: chat.id, message: text })
        resolvePendingMessage(chat.id, localId, idMessage)
      } catch (error) {
        const reason = error instanceof GreenApiError ? error.message : 'Не удалось отправить сообщение'
        failPendingMessage(chat.id, localId, reason)
      }
    },
    [api, chat.id],
  )

  const retry = useCallback(
    (message: Message) => {
      useChatStore.getState().removeMessage(chat.id, message.id)
      void send(message.text)
    },
    [chat.id, send],
  )

  const subtitle = chat.phone ? formatPhone(chat.phone) : `ID ${chat.id}`

  return (
    <section className={`${styles.window} doodle-bg`} aria-label={`Чат с ${chat.name}`}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => setActiveChat(null)} aria-label="Назад к списку чатов">
          <BackIcon />
        </button>
        <Avatar name={chat.name} seed={chat.id} size={40} />
        <div className={styles.info}>
          <h2 className={styles.name}>{chat.name}</h2>
          {subtitle !== chat.name && <span className={styles.subtitle}>{subtitle}</span>}
        </div>
      </header>

      <MessageList messages={messages} onRetry={retry} />
      <Composer key={chat.id} onSend={send} />
    </section>
  )
}
