import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGreenApi, getDefaultApiUrl, GreenApiError } from './greenApi'

const credentials = { idInstance: '3100123456', apiTokenInstance: 'token', apiUrl: 'https://3100.api.green-api.com/' }

function mockFetch(status: number, body: string) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(body, { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('getDefaultApiUrl', () => {
  it('строит хост по первым четырём цифрам idInstance', () => {
    expect(getDefaultApiUrl('3100123456')).toBe('https://3100.api.green-api.com')
  })

  it('возвращает общий хост для некорректного id', () => {
    expect(getDefaultApiUrl('')).toBe('https://api.green-api.com')
  })
})

describe('createGreenApi', () => {
  it('sendMessage отправляет POST с chatId и текстом', async () => {
    const fetchMock = mockFetch(200, '{"idMessage":"42"}')
    const result = await createGreenApi(credentials).sendMessage({ chatId: '10000000', message: 'Привет' })

    expect(result).toEqual({ idMessage: '42' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe('https://3100.api.green-api.com/waInstance3100123456/sendMessage/token')
    expect(init).toMatchObject({ method: 'POST', body: '{"chatId":"10000000","message":"Привет"}' })
  })

  it('receiveNotification передаёт receiveTimeout и возвращает null на пустой очереди', async () => {
    const fetchMock = mockFetch(200, 'null')
    await expect(createGreenApi(credentials).receiveNotification(20)).resolves.toBeNull()
    expect(String(fetchMock.mock.calls[0][0])).toContain('/receiveNotification/token?receiveTimeout=20')
  })

  it('deleteNotification использует DELETE и receiptId в пути', async () => {
    const fetchMock = mockFetch(200, '{"result":true}')
    await createGreenApi(credentials).deleteNotification(7)
    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toMatch(/\/deleteNotification\/token\/7$/)
    expect(init.method).toBe('DELETE')
  })

  it('checkAccount передаёт номер числом', async () => {
    const fetchMock = mockFetch(200, '{"exist":true,"chatId":"10000000"}')
    await createGreenApi(credentials).checkAccount({ phoneNumber: '79991234567' })
    expect(fetchMock.mock.calls[0][1].body).toBe('{"phoneNumber":79991234567}')
  })

  it('checkAccount умеет искать по username', async () => {
    const fetchMock = mockFetch(200, '{"exist":true,"chatId":"10000000"}')
    await createGreenApi(credentials).checkAccount({ username: '@durov' })
    expect(fetchMock.mock.calls[0][1].body).toBe('{"username":"@durov"}')
  })

  it('превращает 401 в понятную ошибку', async () => {
    mockFetch(401, '')
    const error = await createGreenApi(credentials).getStateInstance().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(GreenApiError)
    expect(error).toMatchObject({ status: 401, message: expect.stringContaining('Неверный idInstance') })
  })

  it('сообщает о сетевой ошибке', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(createGreenApi(credentials).getStateInstance()).rejects.toMatchObject({ status: 0 })
  })
})
