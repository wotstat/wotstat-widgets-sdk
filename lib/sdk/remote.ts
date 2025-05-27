import { RemoteDebug, RemoteStateType } from "./debugUtils";
import { EventDispatcher, ReadonlyWatchableValue, useWebSocket, WatchableValue } from "./utils"
import { v4 as uuidv4 } from 'uuid';

const REMOTE_URL = 'wss://widgets-remote.wotstat.info'

export class WidgetsRemote {
  private ws: ReturnType<typeof useWebSocket>
  private uuid: string = uuidv4()
  private states = new Map<string, WatchableValue<any>>()
  private lastState = new WatchableValue(new Map<string, string | boolean | number>())
  private readonly remoteDebug = new RemoteDebug({
    onSetState: state => {
      this.onMessage(new MessageEvent('message', {
        data: JSON.stringify(state)
      }))
    }
  })

  readonly onAnyChange = new EventDispatcher<{ key: string, value: any }>()

  get status() {
    return this.ws.status.readonlyValue
  }

  get fullState() {
    return this.lastState.readonlyValue
  }

  constructor(options?: {
    url?: string
    uuid?: string
    reconnect?: boolean
    channel?: string
  }) {

    this.remoteDebug.isConnected.watch(v => {
      if (!v) return
      this.ws.closeConnection()
      this.ws.status.value = 'connected'
    })

    const params = new URLSearchParams(window.location.search)
    const channel = options?.channel ?? params.get('remote-key') ?? this.uuid;
    const connection = `${options?.url ?? REMOTE_URL}/?uuid=${this.uuid}&channel=${channel}`;

    this.ws = useWebSocket({
      connection: connection,
      reconnect: options?.reconnect ?? true,
      onMessage: this.onMessage
    })
  }

  private onMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data)
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          if (this.states.has(key)) this.states.get(key)!.value = value
          this.lastState.value.set(key, value)
          this.lastState.trigger()
          this.onAnyChange.dispatch({ key, value })
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  defineState<T extends string | number | boolean>(key: string, defaultValue: T, meta?: {
    type?: RemoteStateType
    element?: HTMLElement | (() => HTMLElement) | string
  }) {
    if (this.states.has(key)) return this.states.get(key)!.readonlyValue as ReadonlyWatchableValue<T>

    const state = new WatchableValue<T>(this.lastState.value.get(key) as T ?? defaultValue, () => this.states.delete(key))
    this.states.set(key, state)


    const remoteType = () => {
      if (meta?.type) return meta.type
      if (typeof defaultValue === 'string') return 'string'
      if (typeof defaultValue === 'number') return 'number'
      if (typeof defaultValue === 'boolean') return 'boolean'
      return 'string'
    }
    this.remoteDebug.defineState(key, defaultValue, remoteType())

    return state
  }

  dispose() {
    this.ws.dispose()
    this.states.forEach(state => state.dispose())
    this.states.clear()
    this.lastState.value.clear()
    this.lastState.dispose()
    this.remoteDebug.dispose()
    this.onAnyChange.clear()
  }
}