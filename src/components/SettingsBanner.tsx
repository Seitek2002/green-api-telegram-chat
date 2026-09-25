import type { SettingsState } from '../hooks/useInstanceSettings'
import { CloseIcon } from './icons'
import styles from './Banner.module.css'

interface SettingsBannerProps {
  state: SettingsState
  onFix: () => void
  onDismiss: () => void
}

/** Предупреждение о настройках инстанса, из-за которых не приходят входящие сообщения. */
export function SettingsBanner({ state, onFix, onDismiss }: SettingsBannerProps) {
  if (state.status === 'ok' || state.status === 'checking') return null

  if (state.status === 'fixed') {
    return (
      <div className={styles.banner} data-tone="success" role="status">
        <p className={styles.text}>
          Настройки сохранены. GREEN-API применяет их в течение нескольких минут — после этого новые ответы начнут
          приходить в чат.
        </p>
        <button className={styles.close} onClick={onDismiss} aria-label="Скрыть">
          <CloseIcon width={16} height={16} />
        </button>
      </div>
    )
  }

  return (
    <div className={styles.banner} role="alert">
      <div className={styles.text}>
        <p className={styles.title}>Входящие сообщения не будут приходить</p>
        <ul className={styles.problems}>
          {state.problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
        {state.status === 'error' && <p className={styles.error}>{state.error}</p>}
        <button className={styles.fix} onClick={onFix} disabled={state.status === 'fixing'}>
          {state.status === 'fixing' ? 'Сохраняем…' : 'Исправить настройки'}
        </button>
      </div>
      <button className={styles.close} onClick={onDismiss} aria-label="Скрыть">
        <CloseIcon width={16} height={16} />
      </button>
    </div>
  )
}
