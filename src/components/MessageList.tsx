import { Fragment, useLayoutEffect, useRef } from 'react'
import { formatDateLabel, isSameDay } from '../lib/format'
import type { Message } from '../store/types'
import { MessageBubble } from './MessageBubble'
import styles from './MessageList.module.css'

interface MessageListProps {
  messages: Message[]
  onRetry: (message: Message) => void
}

export function MessageList({ messages, onRetry }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Прокручиваем к последнему сообщению при открытии чата и новых сообщениях
  useLayoutEffect(() => {
    const node = scrollRef.current
    if (node) node.scrollTop = node.scrollHeight
  }, [messages.length])

  return (
    <div className={styles.scroll} ref={scrollRef}>
      {messages.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyCard}>
            <p className={styles.emptyTitle}>Здесь пока пусто</p>
            <p className={styles.emptyText}>Напишите первое сообщение</p>
          </div>
        </div>
      ) : (
        <ol className={styles.list} aria-live="polite">
          {messages.map((message, index) => {
            const prev = messages[index - 1]
            const next = messages[index + 1]
            const showDate = !prev || !isSameDay(prev.timestamp, message.timestamp)
            // Последнее сообщение в серии от одного отправителя получает «хвостик»
            const isLastInGroup =
              !next || next.direction !== message.direction || !isSameDay(next.timestamp, message.timestamp)
            return (
              <Fragment key={message.id}>
                {showDate && (
                  <li className={styles.date}>
                    <span>{formatDateLabel(message.timestamp)}</span>
                  </li>
                )}
                <MessageBubble message={message} isLastInGroup={isLastInGroup} onRetry={onRetry} />
              </Fragment>
            )
          })}
        </ol>
      )}
    </div>
  )
}
