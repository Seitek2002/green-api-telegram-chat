import { useState, type FormEvent } from 'react'
import { createGreenApi, getDefaultApiUrl, GreenApiError } from '../api/greenApi'
import { useAuthStore } from '../store/authStore'
import { useChatStore } from '../store/chatStore'
import { EyeIcon, EyeOffIcon, LogoMark } from './icons'
import styles from './LoginScreen.module.css'

const STATE_HINTS: Record<string, string> = {
  notAuthorized: 'Инстанс не авторизован. Отсканируйте QR-код в личном кабинете GREEN-API',
  blocked: 'Инстанс заблокирован',
  sleepMode: 'Инстанс в спящем режиме. Откройте MAX на телефоне',
  starting: 'Инстанс запускается, попробуйте через минуту',
  yellowCard: 'Отправка сообщений временно ограничена',
}

export function LoginScreen() {
  const login = useAuthStore((state) => state.login)
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [customApiUrl, setCustomApiUrl] = useState<string | null>(null)
  const [showToken, setShowToken] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const apiUrl = customApiUrl ?? getDefaultApiUrl(idInstance)
  const canSubmit = /^\d+$/.test(idInstance.trim()) && apiTokenInstance.trim().length > 0 && !loading

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setError(null)
    setLoading(true)

    const credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim(),
    }

    try {
      const { stateInstance } = await createGreenApi(credentials).getStateInstance()
      if (stateInstance !== 'authorized') {
        setError(STATE_HINTS[stateInstance] ?? `Инстанс не готов к работе (состояние: ${stateInstance})`)
        return
      }
      // История чатов относится к конкретному инстансу
      useChatStore.getState().bindInstance(credentials.idInstance)
      login(credentials)
    } catch (err) {
      setError(err instanceof GreenApiError ? err.message : 'Не удалось проверить учётные данные')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className={`${styles.screen} doodle-bg`}>
      <form className={styles.card} onSubmit={handleSubmit} noValidate>
        <LogoMark className={styles.logo} />
        <h1 className={styles.title}>Вход в MAX Chat</h1>
        <p className={styles.subtitle}>
          Введите параметры инстанса из{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личного кабинета GREEN-API
          </a>
        </p>

        <label className={styles.field}>
          <span className={styles.label}>idInstance</span>
          <input
            className={styles.input}
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value.replace(/\D/g, ''))}
            placeholder="3100123456"
            inputMode="numeric"
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>apiTokenInstance</span>
          <span className={styles.inputWrap}>
            <input
              className={styles.input}
              type={showToken ? 'text' : 'password'}
              value={apiTokenInstance}
              onChange={(e) => setApiTokenInstance(e.target.value)}
              placeholder="Токен инстанса"
              autoComplete="current-password"
              spellCheck={false}
              required
            />
            <button
              type="button"
              className={styles.eye}
              onClick={() => setShowToken((v) => !v)}
              aria-label={showToken ? 'Скрыть токен' : 'Показать токен'}
            >
              {showToken ? <EyeOffIcon width={20} height={20} /> : <EyeIcon width={20} height={20} />}
            </button>
          </span>
        </label>

        <details className={styles.advanced}>
          <summary>Дополнительно</summary>
          <label className={styles.field}>
            <span className={styles.label}>apiUrl</span>
            <input
              className={styles.input}
              value={apiUrl}
              onChange={(e) => setCustomApiUrl(e.target.value)}
              placeholder="https://3100.api.green-api.com"
              inputMode="url"
              spellCheck={false}
            />
            <span className={styles.hint}>Определяется автоматически по idInstance</span>
          </label>
        </details>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <button className={styles.submit} type="submit" disabled={!canSubmit}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
