import { describe, expect, it } from 'vitest'
import { formatPhone, normalizePhone, phoneToChatId } from './phone'

describe('normalizePhone', () => {
  it.each([
    ['+7 (999) 123-45-67', '79991234567'],
    ['89991234567', '79991234567'],
    ['9991234567', '79991234567'],
    ['+996 555 123 456', '996555123456'],
    ['77011234567', '77011234567'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['', '12345', 'abc', '1'.repeat(16)])('отклоняет «%s»', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
})

describe('formatPhone', () => {
  it('форматирует российский номер', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('добавляет плюс к остальным номерам', () => {
    expect(formatPhone('996555123456')).toBe('+996555123456')
  })
})

it('phoneToChatId добавляет суффикс @c.us', () => {
  expect(phoneToChatId('79991234567')).toBe('79991234567@c.us')
})
