import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from './icons'
import styles from './Composer.module.css'

/** Ограничение метода SendMessage */
export const MAX_MESSAGE_LENGTH = 4000
const MAX_TEXTAREA_HEIGHT = 200

interface ComposerProps {
  onSend: (text: string) => void
}

export function Composer({ onSend }: ComposerProps) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const trimmed = text.trim()
  const tooLong = text.length > MAX_MESSAGE_LENGTH

  // Автовысота поля ввода
  useLayoutEffect(() => {
    const node = textareaRef.current
    if (!node) return
    node.style.height = 'auto'
    node.style.height = `${Math.min(node.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [text])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    if (!trimmed || tooLong) return
    onSend(trimmed)
    setText('')
    textareaRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter — отправить, Shift+Enter — перенос строки
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <div className={styles.inner}>
        <div className={styles.field}>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Сообщение"
            aria-label="Текст сообщения"
            rows={1}
            autoFocus
          />
          {text.length > MAX_MESSAGE_LENGTH - 200 && (
            <span className={styles.counter} data-error={tooLong}>
              {MAX_MESSAGE_LENGTH - text.length}
            </span>
          )}
        </div>
        <button
          className={styles.send}
          type="submit"
          disabled={!trimmed || tooLong}
          aria-label="Отправить"
          title="Отправить (Enter)"
        >
          <SendIcon width={22} height={22} />
        </button>
      </div>
    </form>
  )
}
