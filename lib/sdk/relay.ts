import { v4 as uuidv4 } from 'uuid';
import { create, Delta } from "jsondiffpatch";
import { useWebSocket } from './utils';
import { RelayDebug } from './debugUtils';

const RELAY_URL = 'wss://widgets-relay.wotstat.info'
const differ = create()

function tryParseJson(message: string): unknown {
  try { return JSON.parse(message) }
  catch (error) { return null }
}

type ChangeMessage = { type: 'change', uuid: string, name: string, value: unknown }
function isChangeMessage(message: unknown): message is ChangeMessage {
  if (typeof message !== 'object' || message === null) return false;
  if ('type' in message && message['type'] !== 'change') return false;
  return true;
}

type DeltaChangeMessage = { type: 'delta', uuid: string, name: string, delta: Delta }
function isDeltaChangeMessage(message: unknown): message is DeltaChangeMessage {
  if (typeof message !== 'object' || message === null) return false;
  if ('type' in message && message['type'] !== 'delta') return false;
  return true;
}

type DisconnectMessage = { type: 'disconnect', uuid: string }
function isDisconnectMessage(message: unknown): message is DisconnectMessage {
  if (typeof message !== 'object' || message === null) return false;
  if ('type' in message && message['type'] !== 'disconnect') return false;
  return true;
}

type ConnectMessage = { type: 'connect', uuid: string }
function isConnectMessage(message: unknown): message is ConnectMessage {
  if (typeof message !== 'object' || message === null) return false;
  if ('type' in message && message['type'] !== 'connect') return false;
  return true;
}

type UUID = string
type Watcher<T> = (uuid: UUID, value: (T | undefined)) => void
export class RelayState<T> {
  private values = new Map<UUID, T>
  private subscribers = new Set<Watcher<T>>()
  private selfSubscribers = new Set<Watcher<T>>()

  constructor(readonly uuid: UUID, defaultValue: T, private readonly onSet: (uuid: UUID, value: T) => void) {
    this.values.set(uuid, defaultValue)
  }

  get value() {
    return this.values.get(this.uuid) as T
  }

  set value(value: T) {
    this.values.set(this.uuid, value)
    this.onSet(this.uuid, value)
    this.selfSubscribers.forEach(subscriber => subscriber(this.uuid, value))
  }

  valueOf(uuid: UUID) {
    return this.values.get(uuid)
  }

  get all() {
    return [...this.values.entries()]
  }

  get remote() {
    return [...this.values.entries()].filter(([uuid, _]) => uuid !== this.uuid)
  }

  trigger() {
    this.onSet(this.uuid, this.value)
    this.selfSubscribers.forEach(subscriber => subscriber(this.uuid, this.value))
  }

  watch(fn: (uuid: UUID, value: (T | undefined)) => void, options?: { immediate?: boolean, includeSelf?: boolean }) {
    this.subscribers.add(fn)
    if (options?.immediate) this.selfSubscribers.add(fn)

    if (options?.immediate) {
      if (options.includeSelf) fn(this.uuid, this.value)
      this.remote.forEach(([uuid, value]) => fn(uuid, value))
    }

    return () => {
      this.subscribers.delete(fn)
      this.selfSubscribers.delete(fn)
    }
  }

  protected change(uuid: UUID, value: T) {
    if (uuid === this.uuid) return
    this.values.set(uuid, value)
    this.subscribers.forEach(subscriber => subscriber(uuid, value))
  }

  protected disconnect(uuid: UUID) {
    this.values.delete(uuid)
    this.subscribers.forEach(subscriber => subscriber(uuid, undefined))
    this.selfSubscribers.forEach(subscriber => subscriber(uuid, undefined))
  }
}

class ChangeableRelayState<T> extends RelayState<T> {
  change(uuid: UUID, value: T) {
    super.change(uuid, value)
  }

  disconnect(uuid: UUID) {
    super.disconnect(uuid)
  }

  get relayState() {
    return this as RelayState<T>
  }
}

export class WidgetsRelay {
  private readonly uuid: string
  private readonly states = new Map<string, ChangeableRelayState<any>>()
  private readonly lastSendedStates = new Map<ChangeableRelayState<any>, any>()
  private readonly intervalHandler: ReturnType<typeof setInterval>
  private ws: ReturnType<typeof useWebSocket>

  private readonly relayDebug = new RelayDebug({
    onSetState: (uuid, key, value) => {
      this.onMessage(new MessageEvent('message', {
        data: JSON.stringify({ type: 'change', uuid, name: key, value } satisfies ChangeMessage)
      }))
    },
    onClientDisconnected: (uuid) => {
      this.onMessage(new MessageEvent('message', {
        data: JSON.stringify({ type: 'disconnect', uuid } satisfies DisconnectMessage)
      }))
    }
  })

  private throttleInterval: number

  get status() {
    return this.ws.status.readonlyValue
  }

  constructor(options?: {
    url?: string
    uuid?: string
    reconnect?: boolean
    channel?: string
    fullSyncInterval?: number
    throttleInterval?: number
  }) {
    this.uuid = options?.uuid ?? uuidv4();

    const params = new URLSearchParams(window.location.search)
    const channel = options?.channel ?? params.get('channel-key') ?? this.uuid;
    const connection = `${options?.url ?? RELAY_URL}?uuid=${this.uuid}&channel=${channel}`;

    this.ws = useWebSocket({
      connection: connection,
      reconnect: options?.reconnect ?? true,
      onMessage: this.onMessage,
      onClose: this.onClose,
      onOpen: this.onOpen,
    })

    this.throttleInterval = options?.throttleInterval ?? 300

    this.intervalHandler = setInterval(() => {
      for (const [stateKey, stateValue] of this.states) this.sendState(stateKey, stateValue, true)
    }, options?.fullSyncInterval ?? 10000);

    this.relayDebug.isEnabled.watch(v => {
      if (v) {
        this.ws.closeConnection()
        for (const [_, stateValue] of this.states)
          for (const [uuid, _] of stateValue.all)
            if (uuid !== this.uuid) stateValue.disconnect(uuid)

        this.ws.status.value = 'connected'

        for (const [stateKey, stateValue] of this.states) this.relayDebug.sendState(stateKey, stateValue.value)
      }
      else {
        for (const [_, stateValue] of this.states)
          for (const [uuid, _] of stateValue.all)
            if (uuid !== this.uuid) stateValue.disconnect(uuid)
        this.ws.connect()
      }
    })
  }

  createState<T>(name: string, defaultValue: T): RelayState<T> {
    let lastDeltaSync = 0
    let throttleTimer: ReturnType<typeof setTimeout> | null = null

    const relayState = new ChangeableRelayState<T>(this.uuid, defaultValue, (uuid, value) => {
      if (throttleTimer) return

      const delta = performance.now() - lastDeltaSync

      if (delta > this.throttleInterval) {
        this.sendState(name, relayState)
        lastDeltaSync = performance.now()
        return
      }

      throttleTimer = setTimeout(() => {
        this.sendState(name, relayState)
        lastDeltaSync = performance.now()
        throttleTimer = null
      }, this.throttleInterval - delta);
    })

    this.states.set(name, relayState)

    return relayState.relayState
  }

  private sendState(name: string, state: ChangeableRelayState<any>, full = false) {
    const lastSendedState = this.lastSendedStates.get(state)

    if (!full && lastSendedState !== undefined) {
      const delta = differ.diff(lastSendedState, state.value)
      if (delta === undefined) return
      this.ws.send(JSON.stringify({ type: 'delta', uuid: state.uuid, name, delta } satisfies DeltaChangeMessage))
    } else {
      this.ws.send(JSON.stringify({ type: 'change', uuid: state.uuid, name, value: state.value } satisfies ChangeMessage))
    }

    this.relayDebug.sendState(name, state.value)
    this.lastSendedStates.set(state, structuredClone(state.value))
  }

  dispose() {
    this.ws.closeConnection()
    clearInterval(this.intervalHandler)
  }

  private onOpen = () => {
    for (const [stateKey, stateValue] of this.states) this.sendState(stateKey, stateValue)
  }

  private onClose = (event: CloseEvent) => {
    for (const [stateKey, stateValue] of this.states) {
      for (const [uuid, _] of stateValue.all) stateValue.disconnect(uuid)
    }
  }

  private onMessage = (event: MessageEvent) => {
    const message = tryParseJson(event.data)
    if (!message) return

    if (isChangeMessage(message)) {
      const relayState = this.states.get(message.name)
      if (relayState === undefined) return

      relayState.change(message.uuid, message.value)
    }

    if (isDeltaChangeMessage(message)) {
      const relayState = this.states.get(message.name)
      if (relayState === undefined) return

      const lastState = structuredClone(relayState.valueOf(message.uuid)) ?? {}
      const newValue = differ.patch(lastState, message.delta)

      relayState.change(message.uuid, newValue)
    }

    if (isDisconnectMessage(message)) {
      for (const [stateKey, stateValue] of this.states) stateValue.disconnect(message.uuid)
    }

    if (isConnectMessage(message)) {
      for (const [stateKey, stateValue] of this.states) this.sendState(stateKey, stateValue, true)
    }
  }
}