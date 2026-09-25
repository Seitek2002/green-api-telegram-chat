import { memo } from 'react'
import { formatTime } from '../lib/format'
import type { Message, MessageStatus } from '../store/types'
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './icons'
import styles from './MessageBubble.module.css'

const STATUS_LABELS: Record<MessageStatus, string> = {
  pending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

function StatusIcon({ status }: { status: MessageStatus }) {
  const size = { width: 16, height: 16 }
  switch (status) {
    case 'pending':
      return <ClockIcon {...size} />
    case 'sent':
      return <CheckIcon {...size} />
    case 'delivered':
    case 'read':
      return <DoubleCheckIcon width={18} height={16} />
    case 'failed':
      return <AlertIcon {...size} />
  }
}

interface MessageBubbleProps {
  message: Message
  isLastInGroup: boolean
  onRetry: (message: Message) => void
}

export const MessageBubble = memo(function MessageBubble({ message, isLastInGroup, onRetry }: MessageBubbleProps) {
  const isOut = message.direction === 'out'
  const failed = message.status === 'failed'

  return (
    <li className={styles.row} data-direction={message.direction} data-tail={isLastInGroup}>
      <div className={styles.bubble}>
        <span className={styles.text}>{message.text}</span>
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time>
          {isOut && message.status && (
            <span
              className={styles.status}
              data-status={message.status}
              title={STATUS_LABELS[message.status]}
              aria-label={STATUS_LABELS[message.status]}
            >
              <StatusIcon status={message.status} />
            </span>
          )}
        </span>
      </div>
      {failed && (
        <p className={styles.failed}>
          {message.error ?? 'Не отправлено'}
          {' · '}
          <button className={styles.retry} onClick={() => onRetry(message)}>
            Повторить
          </button>
        </p>
      )}
    </li>
  )
})
