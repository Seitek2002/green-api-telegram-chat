import { useCallback, useEffect, useState } from 'react'
import { GreenApiError, type GreenApi } from '../api/greenApi'
import type { InstanceSettings } from '../api/types'

/** Настройки, без которых ReceiveNotification не получит ответы собеседников */
export const REQUIRED_SETTINGS: InstanceSettings = {
  webhookUrl: '',
  incomingWebhook: 'yes',
  outgoingWebhook: 'yes',
  outgoingMessageWebhook: 'yes',
  outgoingAPIMessageWebhook: 'yes',
}

export type SettingsState =
  | { status: 'ok' }
  | { status: 'checking' }
  | { status: 'misconfigured'; problems: string[] }
  | { status: 'fixing'; problems: string[] }
  | { status: 'fixed' }
  | { status: 'error'; problems: string[]; error: string }

export function findSettingsProblems(settings: InstanceSettings): string[] {
  const problems: string[] = []
  if (settings.webhookUrl) problems.push('указан webhookUrl — уведомления уходят на него, а не в очередь HTTP API')
  if (settings.incomingWebhook !== 'yes') problems.push('выключено получение входящих сообщений')
  if (settings.outgoingWebhook !== 'yes') problems.push('выключены статусы исходящих сообщений')
  return problems
}

/**
 * Проверяет настройки инстанса при входе и умеет включить нужные уведомления.
 * Ошибка проверки не блокирует работу чата: метод может быть недоступен.
 */
export function useInstanceSettings(api: GreenApi) {
  const [state, setState] = useState<SettingsState>({ status: 'checking' })

  useEffect(() => {
    const controller = new AbortController()
    api
      .getSettings(controller.signal)
      .then((settings) => {
        const problems = findSettingsProblems(settings)
        setState(problems.length ? { status: 'misconfigured', problems } : { status: 'ok' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'ok' })
      })
    return () => controller.abort()
  }, [api])

  const fix = useCallback(async () => {
    if (state.status !== 'misconfigured' && state.status !== 'error') return
    const { problems } = state
    setState({ status: 'fixing', problems })
    try {
      await api.setSettings(REQUIRED_SETTINGS)
      setState({ status: 'fixed' })
    } catch (error) {
      const message = error instanceof GreenApiError ? error.message : 'Не удалось сохранить настройки'
      setState({ status: 'error', problems, error: message })
    }
  }, [api, state])

  const dismiss = useCallback(() => setState({ status: 'ok' }), [])

  return { state, fix, dismiss }
}
