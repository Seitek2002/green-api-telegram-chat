import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Composer } from './Composer'

describe('Composer', () => {
  it('отправляет обрезанный текст по Enter и очищает поле', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<Composer onSend={onSend} />)

    const input = screen.getByLabelText('Текст сообщения')
    await user.type(input, '  Привет  {Enter}')

    expect(onSend).toHaveBeenCalledWith('Привет')
    expect(input).toHaveValue('')
  })

  it('Shift+Enter переносит строку, а не отправляет', async () => {
    const onSend = vi.fn()
    const user = userEvent.setup()
    render(<Composer onSend={onSend} />)

    await user.type(screen.getByLabelText('Текст сообщения'), 'a{Shift>}{Enter}{/Shift}b')
    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Текст сообщения')).toHaveValue('a\nb')
  })

  it('не отправляет пустое сообщение', async () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    expect(screen.getByRole('button', { name: 'Отправить' })).toBeDisabled()
  })
})
