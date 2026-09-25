import type { BacklogState } from '../hooks/useQueueBacklog'
import { CloseIcon } from './icons'
import styles from './Banner.module.css'

interface BacklogBannerProps {
  state: BacklogState
  onClear: () => void
  onDismiss: () => void
}

/** Средняя скорость разбора очереди: receiveNotification + deleteNotification на каждое уведомление */
const NOTIFICATIONS_PER_MINUTE = 120

export function BacklogBanner({ state, onClear, onDismiss }: BacklogBannerProps) {
  if (state.status === 'none') return null
  const minutes = Math.max(1, Math.round(state.count / NOTIFICATIONS_PER_MINUTE))

  return (
    <div className={styles.banner} role="status">
      <div className={styles.text}>
        <p className={styles.title}>В очереди {state.count} старых уведомлений</p>
        <p className={styles.description}>
          Новые сообщения придут после них — примерно через {minutes} мин. Старые уведомления можно пропустить: сами
          сообщения останутся в Telegram.
        </p>
        {state.status === 'backlog' && state.error && <p className={styles.error}>{state.error}</p>}
        <button className={styles.fix} onClick={onClear} disabled={state.status === 'clearing'}>
          {state.status === 'clearing' ? 'Очищаем…' : 'Пропустить старые'}
        </button>
      </div>
      <button className={styles.close} onClick={onDismiss} aria-label="Скрыть">
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  )
}
