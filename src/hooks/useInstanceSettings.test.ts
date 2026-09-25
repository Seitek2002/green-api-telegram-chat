import { describe, expect, it } from 'vitest'
import { findSettingsProblems, REQUIRED_SETTINGS } from './useInstanceSettings'

describe('findSettingsProblems', () => {
  it('не находит проблем в правильных настройках', () => {
    expect(findSettingsProblems(REQUIRED_SETTINGS)).toEqual([])
  })

  it('замечает выключенные входящие и указанный webhookUrl', () => {
    const problems = findSettingsProblems({ ...REQUIRED_SETTINGS, webhookUrl: 'https://example.com', incomingWebhook: 'no' })
    expect(problems).toHaveLength(2)
    expect(problems.join(' ')).toMatch(/webhookUrl/)
    expect(problems.join(' ')).toMatch(/входящих/)
  })
})
