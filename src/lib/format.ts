const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const dayMonthFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })
const fullDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
const shortDateFormatter = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
const DAY_MS = 24 * 60 * 60 * 1000

export function formatTime(timestamp: number): string {
  return timeFormatter.format(timestamp)
}

/** Подпись разделителя дат в ленте сообщений. */
export function formatDateLabel(timestamp: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(new Date(now)) - startOfDay(new Date(timestamp))) / DAY_MS)
  if (diff === 0) return 'Сегодня'
  if (diff === 1) return 'Вчера'
  const sameYear = new Date(timestamp).getFullYear() === new Date(now).getFullYear()
  return (sameYear ? dayMonthFormatter : fullDateFormatter).format(timestamp)
}

/** Время последнего сообщения в списке чатов. */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  const diff = Math.round((startOfDay(new Date(now)) - startOfDay(new Date(timestamp))) / DAY_MS)
  if (diff === 0) return formatTime(timestamp)
  if (diff === 1) return 'Вчера'
  return shortDateFormatter.format(timestamp)
}

export function isSameDay(a: number, b: number): boolean {
  return startOfDay(new Date(a)) === startOfDay(new Date(b))
}
