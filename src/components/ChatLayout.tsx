import { useGreenApi } from '../hooks/useGreenApi'
import { useInstanceSettings } from '../hooks/useInstanceSettings'
import { useNotificationPolling } from '../hooks/useNotificationPolling'
import { useQueueBacklog } from '../hooks/useQueueBacklog'
import { useChatStore } from '../store/chatStore'
import { ChatWindow } from './ChatWindow'
import { ChatBubbleIcon } from './icons'
import { Sidebar } from './Sidebar'
import styles from './ChatLayout.module.css'

export function ChatLayout() {
  const api = useGreenApi()
  const connection = useNotificationPolling(api)
  const settings = useInstanceSettings(api)
  const backlog = useQueueBacklog(api)
  const activeChat = useChatStore((state) => (state.activeChatId ? state.chats[state.activeChatId] : undefined))

  return (
    <div className={styles.layout} data-chat-open={Boolean(activeChat)}>
      <Sidebar api={api} connection={connection} settings={settings} backlog={backlog} />
      <main className={styles.main}>
        {activeChat ? (
          <ChatWindow key={activeChat.id} api={api} chat={activeChat} />
        ) : (
          <div className={`${styles.placeholder} doodle-bg`}>
            <div className={styles.placeholderCard}>
              <ChatBubbleIcon width={32} height={32} />
              <p>Выберите чат или создайте новый по номеру телефона или @username</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
