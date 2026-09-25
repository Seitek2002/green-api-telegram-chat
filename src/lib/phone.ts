/**
 * Приводит введённый номер к формату GREEN-API: только цифры, международный формат.
 * Российский «8XXXXXXXXXX» и десятизначный «9XXXXXXXXX» превращаются в «7XXXXXXXXXX».
 * Возвращает null, если номер не похож на телефон.
 */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = `7${digits.slice(1)}`
  if (digits.length === 10 && digits.startsWith('9')) digits = `7${digits}`
  return digits.length >= 10 && digits.length <= 15 ? digits : null
}

/** Красиво форматирует номер для отображения: +7 999 123-45-67. */
export function formatPhone(digits: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(digits)
  if (match) return `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}`
  return `+${digits}`
}

/** chatId на основе номера телефона, используется, если CheckAccount недоступен. */
export function phoneToChatId(digits: string): string {
  return `${digits}@c.us`
}

export type Recipient = { type: 'phone'; phone: string } | { type: 'username'; username: string }

/** Распознаёт получателя: номер телефона или Telegram username (@name). */
export function parseRecipient(input: string): Recipient | null {
  const value = input.trim()
  const username = /^@?([a-zA-Z][a-zA-Z0-9_]{4,31})$/.exec(value)
  if (username) return { type: 'username', username: `@${username[1]}` }
  const phone = normalizePhone(value)
  return phone ? { type: 'phone', phone } : null
}
