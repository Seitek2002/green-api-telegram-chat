import { useState, type FormEvent } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'
import { normalizePhone, phoneToChatId } from '../lib/phone'
import { useChatStore } from '../store/chatStore'
import { CloseIcon } from './icons'
import styles from './NewChatForm.module.css'

interface NewChatFormProps {
  api: GreenApi
  onClose: () => void
}

/**
 * Создание чата по номеру телефона. Номер проверяется методом CheckAccount,
 * который возвращает chatId пользователя MAX. Если метод недоступен,
 * используется chatId вида «номер@c.us».
 */
export function NewChatForm({ api, onClose }: NewChatFormProps) {
  const openChat = useChatStore((state) => state.openChat)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const phone = normalizePhone(value)
    if (!phone) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const account = await api.checkAccount(phone)
      if (!account.exist) {
        setError('Этот номер не зарегистрирован в MAX')
        return
      }
      openChat({ id: account.chatId || phoneToChatId(phone), phone })
      onClose()
    } catch (err) {
      // Неверный токен или недоступный API — показываем ошибку.
      // Иначе (метод не поддерживается тарифом и т.п.) создаём чат по номеру.
      if (err instanceof GreenApiError && (err.status === 0 || err.status === 401 || err.status === 403)) {
        setError(err.message)
        return
      }
      openChat({ id: phoneToChatId(phone), phone })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.row}>
        <input
          className={styles.input}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="Номер телефона получателя"
          inputMode="tel"
          autoComplete="tel"
          aria-label="Номер телефона получателя"
          autoFocus
        />
        <button type="button" className={styles.close} onClick={onClose} aria-label="Отмена">
          <CloseIcon width={18} height={18} />
        </button>
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <button className={styles.submit} type="submit" disabled={loading || !value.trim()}>
        {loading ? 'Проверяем номер…' : 'Создать чат'}
      </button>
    </form>
  )
}
