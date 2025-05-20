import { ReadonlyWatchableValue, useWebSocket, WatchableValue } from "./utils"
import { v4 as uuidv4 } from 'uuid';

const REMOTE_URL = 'wss://widgets-remote.wotstat.info'

export class WidgetsRemote {
  private ws: ReturnType<typeof useWebSocket>
  private uuid: string = uuidv4()
  private states = new Map<string, WatchableValue<any>>()
  private lastState = new Map<string, string | boolean | number>()

  get status() {
    return this.ws.status
  }

  constructor(options?: {
    url?: string
    uuid?: string
    reconnect?: boolean
    channel?: string
    fullSyncInterval?: number
    throttleInterval?: number
  }) {


    const params = new URLSearchParams(window.location.search)
    const channel = options?.channel ?? params.get('remote-key') ?? params.get('channel-key') ?? this.uuid;
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
          this.lastState.set(key, value)
        }
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }

  defineState<T extends string | number | boolean>(key: string, defaultValue: T) {
    if (this.states.has(key)) return this.states.get(key)!.readonlyValue as ReadonlyWatchableValue<T>

    const state = new WatchableValue<T>(this.lastState.get(key) as T ?? defaultValue, () => this.states.delete(key))
    this.states.set(key, state)

    return state
  }
}