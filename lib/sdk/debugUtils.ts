import { WatchableValue } from "./utils";
import { ChangeStateMessage, InitMessage, TriggerMessage } from "./types";

const REMOTE_DEBUG_KEY = 'wotstat-widgets-debug-remote'
const SDK_DEBUG_KEY = 'wotstat-widgets-debug-sdk'
const RELAY_DEBUG_KEY = 'wotstat-widgets-debug-relay'


const COMMANDS = {
  SETUP_DEBUG: 'SETUP_DEBUG',
  SETUP_CONNECTION: 'SETUP_CONNECTION',
  SETUP_DISCONNECTION: 'SETUP_DISCONNECTION',
  CONNECT: 'CONNECT',
  DISCONNECT: 'DISCONNECT',
  SETUP_STATE: 'SETUP_STATE',
  SET_VALUE: 'SET_VALUE',
  REMOVE_CLIENT: 'REMOVE_CLIENT',
  GET_BOUNDING_FOR_STATE: 'GET_BOUNDING_FOR_STATE',
  BOUNDING_FOR_STATE: 'BOUNDING_FOR_STATE',
  SEND_MESSAGE: 'SEND_MESSAGE',
} as const


export type RemoteStateType = 'string' | 'number' | 'boolean' | 'color' | {
  type: 'select',
  variants: string[]
}

type RemoteState = {
  type: RemoteStateType,
  value: any,
}

abstract class BaseDebug {
  private enabled = new WatchableValue<boolean>(false)
  private connected = new WatchableValue<boolean>(false)

  get isEnabled() {
    return this.enabled.readonlyValue
  }

  get isConnected() {
    return this.connected.readonlyValue
  }

  constructor(private key: string) {
    window.addEventListener('message', this.onMessageFromWidget)
    this.post({ command: COMMANDS.SETUP_DEBUG })
  }

  protected onMessageFromWidget = (event: MessageEvent) => {
    if (typeof event.data !== 'object') return
    if (event.data === null) return
    if (!('key' in event.data)) return
    if (event.data.key !== this.key) return

    if ('command' in event.data.data) {
      if (event.data.data.command === COMMANDS.SETUP_CONNECTION) this.enabled.value = true
      if (event.data.data.command === COMMANDS.SETUP_DISCONNECTION) this.enabled.value = false
      if (event.data.data.command === COMMANDS.CONNECT) this.connected.value = true
      if (event.data.data.command === COMMANDS.DISCONNECT) this.connected.value = false
      this.processCommand(event.data.data.command, event.data.data)
    }
  }

  abstract processCommand(command: string, data: any): void;

  post(data: any) {
    if (window.self === window.top) return
    window.top?.postMessage({ key: this.key, data }, "*")
  }

  dispose() {
    window.removeEventListener('message', this.onMessageFromWidget)
  }
}

abstract class BaseDebugConnection {
  private enabled = new WatchableValue<boolean>(false)
  private connected = new WatchableValue<boolean>(false)

  get isEnabled() {
    return this.enabled.readonlyValue
  }

  get isConnected() {
    return this.connected.readonlyValue
  }

  constructor(private frame: HTMLIFrameElement, private key: string) {
    window.addEventListener('message', this.onMessageFromWidget)
  }

  protected onMessageFromWidget = (event: MessageEvent) => {
    if (event.source !== this.frame.contentWindow) return;

    const url = new URL(this.frame.src);
    if (event.origin !== `${url.protocol}//${url.host}`) return

    if (typeof event.data !== 'object') return
    if (event.data === null) return
    if (!('key' in event.data)) return
    if (event.data.key !== this.key) return;


    if ('command' in event.data.data) {
      if (event.data.data.command === COMMANDS.SETUP_DEBUG) {
        this.post({ command: COMMANDS.SETUP_CONNECTION })
        this.enabled.value = true
      }

      this.processCommand(event.data.data.command, event.data.data)
    }
  }

  post(data: any) {
    this.frame.contentWindow?.postMessage({ key: this.key, data }, "*")
  }

  connect() {
    this.post({ command: COMMANDS.CONNECT })
  }

  disconnect() {
    this.post({ command: COMMANDS.DISCONNECT })
  }

  abstract processCommand(command: string, data: any): void;

  dispose() {
    this.post({ command: COMMANDS.SETUP_DISCONNECTION })
    window.removeEventListener('message', this.onMessageFromWidget)
    this.enabled.dispose()
  }

}

export class RemoteDebugConnection extends BaseDebugConnection {

  private states = new WatchableValue(new Map<string, RemoteState>())

  constructor(frame: HTMLIFrameElement) {
    super(frame, REMOTE_DEBUG_KEY)
  }

  get registeredStates() {
    return this.states.readonlyValue
  }

  dispose() {
    super.dispose()
    this.states.dispose()
  }

  setState(state: Record<string, any>) {
    this.post({ command: COMMANDS.SET_VALUE, state })
  }

  setValue(key: string, value: any) {
    this.post({ command: COMMANDS.SET_VALUE, state: { [key]: value } })
  }

  processCommand(command: string, data: any) {
    switch (command) {
      case COMMANDS.SETUP_STATE:
        this.states.value.set(data.key, data.meta)
        this.states.trigger()
        break
    }
  }
}

export class RemoteDebug extends BaseDebug {

  constructor(private readonly options: {
    onSetState: (state: Record<string, any>) => void
  }) {
    super(REMOTE_DEBUG_KEY)
  }

  defineState(key: string, value: any, type: RemoteStateType) {
    this.post({
      command: COMMANDS.SETUP_STATE,
      key,
      meta: {
        key,
        type,
        value
      }
    })
  }

  processCommand(command: string, data: any) {
    switch (command) {
      case COMMANDS.SET_VALUE:
        this.options.onSetState(data.state)
        break
    }
  }
}

export class SdkDebugConnection extends BaseDebugConnection {
  constructor(frame: HTMLIFrameElement) {
    super(frame, SDK_DEBUG_KEY)
  }

  connect() {
    super.connect()
  }

  processCommand(command: string, data: any): void { }

  sendMessage(message: InitMessage | ChangeStateMessage | TriggerMessage) {
    this.post({ command: COMMANDS.SEND_MESSAGE, message });
  }

  sendInit(initialData: Record<string, any> | undefined) {
    const states = initialData ? Object.entries(initialData).map(([path, value]) => ({ path, value })) : [];
    this.sendMessage({ type: 'init', states: states });
  }

  sendTrigger(path: string, value?: any) {
    this.sendMessage({ type: 'trigger', path, value });
  }

  sendChangeState(path: string, value: any) {
    this.sendMessage({ type: 'state', path, value });
  }

}

export class SdkDebug extends BaseDebug {
  constructor(private callbacks: {
    onMessage: (message: any) => void
  }) {
    super(SDK_DEBUG_KEY)
  }

  sendMessage(message: InitMessage | ChangeStateMessage | TriggerMessage) {
    this.callbacks.onMessage(message);
  }

  processCommand(command: string, data: any) {
    if (command === COMMANDS.SEND_MESSAGE) {
      this.sendMessage(data.message);
    }
  }
}

export class RelayDebugConnection extends BaseDebugConnection {

  private states = new WatchableValue(new Map<string, any>())

  get registeredStates() {
    return this.states.readonlyValue
  }

  constructor(frame: HTMLIFrameElement) {
    super(frame, RELAY_DEBUG_KEY);
  }

  processCommand(command: string, data: any): void {

    if (command === COMMANDS.SET_VALUE) {
      const { name, value } = data;
      this.states.value.set(name, value);
      this.states.trigger();
    }
  }

  sendState(uuid: string, name: string, value: any) {
    this.post({ command: COMMANDS.SET_VALUE, uuid, name, value });
  }

  removeClient(uuid: string) {
    this.post({ command: COMMANDS.REMOVE_CLIENT, uuid });
  }

}

export class RelayDebug extends BaseDebug {
  constructor(private readonly options: {
    onSetState: (uuid: string, key: string, value: any) => void,
    onClientDisconnected: (uuid: string) => void
  }) {
    super(RELAY_DEBUG_KEY);
  }

  processCommand(command: string, data: any) {

    if (command === COMMANDS.SET_VALUE) {
      const { uuid, name, value } = data;
      this.options.onSetState(uuid, name, value);
    } else if (command === COMMANDS.REMOVE_CLIENT) {
      const { uuid } = data;
      this.options.onClientDisconnected(uuid);
    }
  }

  setupState(name: string, value: any) {
    this.post({ command: COMMANDS.SET_VALUE, name, value });
  }

  sendState(name: string, value: any) {
    this.post({ command: COMMANDS.SET_VALUE, name, value });
  }
}