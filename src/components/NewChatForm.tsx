import { useState, type FormEvent } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'
import { parseRecipient, phoneToChatId } from '../lib/phone'
import { useChatStore } from '../store/chatStore'
import { CloseIcon } from './icons'
import styles from './NewChatForm.module.css'

interface NewChatFormProps {
  api: GreenApi
  onClose: () => void
}

/**
 * Создание чата по номеру телефона или username. Получатель проверяется методом
 * CheckAccount, который возвращает chatId пользователя Telegram. Если метод
 * недоступен, для номера используется chatId вида «номер@c.us».
 */
export function NewChatForm({ api, onClose }: NewChatFormProps) {
  const openChat = useChatStore((state) => state.openChat)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const recipient = parseRecipient(value)
    if (!recipient) {
      setError('Введите номер в международном формате (+7 999 123-45-67) или @username')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const account = await api.checkAccount(
        recipient.type === 'phone' ? { phoneNumber: recipient.phone } : { username: recipient.username },
      )
      if (!account.exist || (recipient.type === 'username' && !account.chatId)) {
        setError(
          recipient.type === 'phone'
            ? 'Этот номер не зарегистрирован в Telegram или скрыт настройками приватности'
            : 'Пользователь с таким username не найден',
        )
        return
      }
      const phone =
        recipient.type === 'phone'
          ? recipient.phone
          : account.phoneNumber
            ? String(account.phoneNumber)
            : undefined
      openChat({
        id: account.chatId || phoneToChatId(phone ?? ''),
        name: recipient.type === 'username' ? recipient.username : undefined,
        phone,
      })
      onClose()
    } catch (err) {
      // Неверный токен или недоступный API — показываем ошибку.
      // Иначе (метод не поддерживается тарифом и т.п.) создаём чат по номеру.
      const fatal = err instanceof GreenApiError && (err.status === 0 || err.status === 401 || err.status === 403)
      if (fatal || recipient.type === 'username') {
        setError(err instanceof GreenApiError ? err.message : 'Не удалось найти пользователя')
        return
      }
      openChat({ id: phoneToChatId(recipient.phone), phone: recipient.phone })
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
          placeholder="Номер телефона или @username"
          autoComplete="off"
          spellCheck={false}
          aria-label="Номер телефона или username получателя"
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
        {loading ? 'Ищем в Telegram…' : 'Создать чат'}
      </button>
    </form>
  )
}
