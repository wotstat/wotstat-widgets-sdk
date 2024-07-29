import { createDeepProxy } from "../utils/deepProxy";
import { InitMessage } from "./types";
import { isValidChangeStateData, isValidInitData, isValidTriggerData } from "./utils";

export type SDKStatus = 'connecting' | 'ready'

export type Options = Partial<{
  wsHost: string;
  wsPort: number;
}>


function tryParseJson(message: string): unknown {
  try {
    return JSON.parse(message);
  } catch (error) {
    return null;
  }
}

export class SDK<T extends object> {
  private websocket: WebSocket | null = null
  private _status: SDKStatus = 'connecting'
  private readonly onStatusChangeCallbacks = new Set<(status: SDKStatus) => void>()
  private readonly dataProxy = createDeepProxy<T>()

  private port = 33800
  private host = 'localhost'

  get status() {
    return this._status
  }

  private set status(value: SDKStatus) {
    if (this._status === value) return
    this._status = value
    for (const callback of this.onStatusChangeCallbacks) callback(value)
  }

  get data() {
    return this.dataProxy.proxy;
  }

  constructor(options: Options) {
    this.port = options.wsPort ?? this.port
    this.host = options.wsHost ?? this.host
    this.reconnect()
  }

  onStatusChange(callback: (status: SDKStatus) => void) {
    this.onStatusChangeCallbacks.add(callback)
    return () => this.onStatusChangeCallbacks.delete(callback)
  }

  private reconnect() {
    if (this.websocket !== null) {
      if (this.websocket.readyState === WebSocket.OPEN) {
        this.websocket.close()
      }

      this.websocket.removeEventListener('message', this.onMessage)
      this.websocket.removeEventListener('open', this.onOpen)
      this.websocket.removeEventListener('close', this.onClose)
      this.websocket.removeEventListener('error', this.onError)
    }

    this.status = 'connecting'

    this.websocket = new WebSocket(`ws://${this.host}:${this.port}`)
    this.websocket.addEventListener('message', this.onMessage)
    this.websocket.addEventListener('open', this.onOpen)
    this.websocket.addEventListener('close', this.onClose)
    this.websocket.addEventListener('error', this.onError)
  }

  private onInitMessage(msg: InitMessage) {
    const initial = new Map<string, any>(msg.states.map(({ path, value }) => [path, value]));
    this.dataProxy.resetup(initial)
    this.status = 'ready'
  }

  private onOpen = () => {
  }

  private onClose = (event: CloseEvent) => {
    this.status = 'connecting'
    setTimeout(() => { this.reconnect() }, 300);
  }

  private onError = () => {
    this.status = 'connecting'
    setTimeout(() => { this.reconnect() }, 300);
  }

  private onMessage = (event: MessageEvent) => {
    const msg = tryParseJson(event.data)
    if (!msg) return

    if (isValidInitData(msg)) {
      this.onInitMessage(msg)
    } else if (isValidChangeStateData(msg)) {
      this.dataProxy.update(msg.path, msg.value)
    } else if (isValidTriggerData(msg)) {
      this.dataProxy.trigger(msg.path, msg.value)
    } else {
      console.error('Unknown message type', msg)
    }
  }
}