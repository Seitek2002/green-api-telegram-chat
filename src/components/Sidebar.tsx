import { useMemo, useState } from 'react'
import type { GreenApi } from '../api/greenApi'
import type { PollingState } from '../hooks/useNotificationPolling'
import { formatChatTime } from '../lib/format'
import { formatPhone } from '../lib/phone'
import { useAuthStore } from '../store/authStore'
import { sortChats, useChatStore } from '../store/chatStore'
import { Avatar } from './Avatar'
import { ChatBubbleIcon, LogoutIcon, PlusIcon } from './icons'
import { NewChatForm } from './NewChatForm'
import styles from './Sidebar.module.css'

const CONNECTION_LABELS: Record<PollingState['status'], string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  error: 'Нет соединения',
}

interface SidebarProps {
  api: GreenApi
  connection: PollingState
}

export function Sidebar({ api, connection }: SidebarProps) {
  const chats = useChatStore((state) => state.chats)
  const messages = useChatStore((state) => state.messages)
  const activeChatId = useChatStore((state) => state.activeChatId)
  const setActiveChat = useChatStore((state) => state.setActiveChat)
  const idInstance = useAuthStore((state) => state.credentials?.idInstance)
  const logout = useAuthStore((state) => state.logout)
  const [isCreating, setIsCreating] = useState(false)

  const sortedChats = useMemo(() => sortChats(chats), [chats])

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>Чаты</h1>
          <span
            className={styles.connection}
            data-status={connection.status}
            title={connection.error ?? undefined}
          >
            <span className={styles.dot} />
            {CONNECTION_LABELS[connection.status]} · {idInstance}
          </span>
        </div>
        <button
          className={styles.iconButton}
          onClick={() => setIsCreating((v) => !v)}
          aria-label="Новый чат"
          title="Новый чат"
          aria-pressed={isCreating}
        >
          <PlusIcon width={22} height={22} />
        </button>
        <button className={styles.iconButton} onClick={logout} aria-label="Выйти" title="Выйти">
          <LogoutIcon width={20} height={20} />
        </button>
      </header>

      {connection.status === 'error' && connection.error && (
        <p className={styles.banner} role="status">
          {connection.error}
        </p>
      )}

      {isCreating && <NewChatForm api={api} onClose={() => setIsCreating(false)} />}

      {sortedChats.length === 0 ? (
        <div className={styles.empty}>
          <ChatBubbleIcon width={40} height={40} />
          <p>Пока нет чатов</p>
          {!isCreating && (
            <button className={styles.emptyButton} onClick={() => setIsCreating(true)}>
              Начать новый чат
            </button>
          )}
        </div>
      ) : (
        <ul className={styles.list}>
          {sortedChats.map((chat) => {
            const list = messages[chat.id]
            const last = list?.[list.length - 1]
            const preview = last ? `${last.direction === 'out' ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'
            return (
              <li key={chat.id}>
                <button
                  className={styles.item}
                  data-active={chat.id === activeChatId}
                  onClick={() => setActiveChat(chat.id)}
                >
                  <Avatar name={chat.name} seed={chat.id} />
                  <span className={styles.itemBody}>
                    <span className={styles.itemTop}>
                      <span className={styles.itemName}>{chat.name}</span>
                      {last && <span className={styles.itemTime}>{formatChatTime(last.timestamp)}</span>}
                    </span>
                    <span className={styles.itemBottom}>
                      <span className={styles.itemPreview}>
                        {preview || (chat.phone ? formatPhone(chat.phone) : '')}
                      </span>
                      {chat.unread > 0 && <span className={styles.badge}>{chat.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </aside>
  )
}
