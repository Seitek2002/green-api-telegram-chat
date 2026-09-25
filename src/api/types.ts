/** Параметры доступа к инстансу GREEN-API. */
export interface Credentials {
  idInstance: string
  apiTokenInstance: string
  /** Хост API, например https://3100.api.green-api.com */
  apiUrl: string
}

export type InstanceState =
  | 'authorized'
  | 'notAuthorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'yellowCard'
  | (string & {})

export interface GetStateInstanceResponse {
  stateInstance: InstanceState
}

export interface CheckAccountResponse {
  exist: boolean
  /** chatId пользователя MAX, привязанного к номеру телефона */
  chatId?: string
  fromCache?: boolean
}

export interface SendMessageRequest {
  chatId: string
  message: string
}

export interface SendMessageResponse {
  idMessage: string
}

export interface DeleteNotificationResponse {
  result: boolean
  reason?: string
}

export interface ReceivedNotification {
  receiptId: number
  body: NotificationBody
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: 'user' | 'group' | (string & {})
  sender?: string
  senderName?: string
  senderContactName?: string
  senderPhoneNumber?: number | string
}

export interface MessageData {
  typeMessage: string
  textMessageData?: { textMessage: string }
  extendedTextMessageData?: { text: string }
}

/**
 * Тело входящего уведомления. Описаны только поля, которые использует приложение,
 * остальные типы уведомлений (статус инстанса, квоты и т.д.) просто пропускаются.
 */
export interface NotificationBody {
  typeWebhook: string
  timestamp?: number
  idMessage?: string
  senderData?: SenderData
  messageData?: MessageData
  /** Поля уведомления outgoingMessageStatus */
  chatId?: string
  status?: string
  description?: string
}
