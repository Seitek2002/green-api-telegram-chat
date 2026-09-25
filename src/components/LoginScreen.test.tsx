import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '../store/authStore'
import { LoginScreen } from './LoginScreen'

function mockState(status: number, body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

async function fillAndSubmit() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('idInstance'), '3100123456')
  await user.type(screen.getByLabelText('apiTokenInstance'), 'secret')
  await user.click(screen.getByRole('button', { name: 'Войти' }))
}

describe('LoginScreen', () => {
  beforeEach(() => useAuthStore.setState({ credentials: null }))
  afterEach(() => vi.unstubAllGlobals())

  it('кнопка входа неактивна, пока поля не заполнены', () => {
    render(<LoginScreen />)
    expect(screen.getByRole('button', { name: 'Войти' })).toBeDisabled()
  })

  it('сохраняет учётные данные для авторизованного инстанса', async () => {
    const fetchMock = mockState(200, '{"stateInstance":"authorized"}')
    render(<LoginScreen />)
    await fillAndSubmit()

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'https://3100.api.green-api.com/waInstance3100123456/getStateInstance/secret',
    )
    expect(useAuthStore.getState().credentials).toEqual({
      idInstance: '3100123456',
      apiTokenInstance: 'secret',
      apiUrl: 'https://3100.api.green-api.com',
    })
  })

  it('показывает подсказку, если инстанс не авторизован', async () => {
    mockState(200, '{"stateInstance":"notAuthorized"}')
    render(<LoginScreen />)
    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Инстанс не авторизован')
    expect(useAuthStore.getState().credentials).toBeNull()
  })

  it('показывает ошибку при неверном токене', async () => {
    mockState(401, '')
    render(<LoginScreen />)
    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный idInstance или apiTokenInstance')
  })
})
