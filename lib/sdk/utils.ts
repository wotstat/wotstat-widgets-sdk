
import { ChangeStateMessage, InitMessage, TriggerMessage } from "./types"


export function isValidInitData(data: unknown): data is InitMessage {

  if (typeof data !== 'object') return false
  if (data === null) return false
  if (!('type' in data)) return false
  if (data.type !== 'init') return false
  if (!('states' in data)) return false
  if (!Array.isArray(data.states)) return false

  return true
}

export function isValidChangeStateData(data: unknown): data is ChangeStateMessage {
  if (typeof data !== 'object') return false
  if (data === null) return false
  if (!('type' in data)) return false
  if (data.type !== 'state') return false
  if (!('path' in data)) return false
  if (!('value' in data)) return false

  return true
}

export function isValidTriggerData(data: unknown): data is TriggerMessage {
  if (typeof data !== 'object') return false
  if (data === null) return false
  if (!('type' in data)) return false
  if (data.type !== 'trigger') return false
  if (!('path' in data)) return false

  return true
}

export class ReadonlyWatchableValue<T> {
  private currentValue: T
  private readonly subscribers = new Set<(value: T) => void>()

  constructor(defaultValue: T, private onDispose?: () => void) {
    this.currentValue = defaultValue
  }

  get value() {
    return this.currentValue
  }

  protected set value(value: T) {
    this.currentValue = value
    this.trigger()
  }

  watch(fn: (value: T) => void, options?: { immediate?: boolean }) {
    if (options?.immediate) fn(this.currentValue)
    this.subscribers.add(fn)
    return () => this.subscribers.delete(fn)
  }

  protected trigger() {
    this.subscribers.forEach(subscriber => subscriber(this.currentValue))
  }

  protected dispose() {
    this.subscribers.clear()
    this.onDispose?.()
  }
}

export class WatchableValue<T> extends ReadonlyWatchableValue<T> {
  override set value(value: T) {
    super.value = value
  }

  override get value() {
    return super.value
  }

  dispose() {
    super.dispose()
  }

  trigger() {
    super.trigger()
  }

  get readonlyValue() {
    return this as ReadonlyWatchableValue<T>
  }
}

export function useWebSocket(options: {
  connection: string
  reconnect?: boolean
  onMessage?: (event: MessageEvent) => void
  onClose?: (event: CloseEvent) => void
  onOpen?: () => void
}) {
  let websocket: WebSocket | null = null;
  const status = new WatchableValue<'connecting' | 'connected' | 'disconnected'>('connecting')
  let retryCount = 0

  function connect() {
    retryCount++
    closeConnection();
    status.value = 'connecting'
    websocket = new WebSocket(options.connection);
    websocket.addEventListener('message', onMessage)
    websocket.addEventListener('close', onClose)
    websocket.addEventListener('open', onOpen)
  }

  function closeConnection() {
    if (websocket !== null) {
      websocket.removeEventListener('message', onMessage)
      websocket.removeEventListener('close', onClose)
      websocket.removeEventListener('open', onOpen)
      websocket.close()
    }
    status.value = 'disconnected'
  }

  function onOpen() {
    retryCount = 0
    status.value = 'connected'
    options.onOpen?.()
  }

  function onClose(event: CloseEvent) {
    options.onClose?.(event)

    status.value = 'disconnected'

    if (options.reconnect !== true) return
    let delay = 100

    if (retryCount > 1000) delay = 10000
    else if (retryCount > 50) delay = 1000
    else if (retryCount > 10) delay = 500
    setTimeout(() => connect(), delay)
  }

  function onMessage(event: MessageEvent) {
    options.onMessage?.(event)
  }

  function send(data: string | ArrayBufferLike | Blob | ArrayBufferView) {
    if (!websocket) return
    if (websocket.readyState !== WebSocket.OPEN) return
    websocket.send(data)
  }

  function dispose() {
    closeConnection()
    websocket = null
    status.dispose()
  }

  connect()

  return {
    status,
    connect,
    closeConnection,
    send,
    dispose
  }
}

export class EventDispatcher<T> {
  private listeners = new Set<(event: T) => void>()

  addListener(listener: (event: T) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispatch(event: T) {
    this.listeners.forEach(listener => listener(event))
  }

  clear() {
    this.listeners.clear()
  }
}