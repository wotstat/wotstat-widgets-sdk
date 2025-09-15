import { WatchableValue } from "./utils";
import { ChangeStateMessage, InitMessage, TriggerMessage } from "./types";

const REMOTE_DEBUG_KEY = 'wotstat-widgets-debug-remote'
const SDK_DEBUG_KEY = 'wotstat-widgets-debug-sdk'
const RELAY_DEBUG_KEY = 'wotstat-widgets-debug-relay'


const COMMANDS = {
  SETUP_DEBUG: 'SETUP_DEBUG',
  SETUP_CONNECTION: 'SETUP_CONNECTION',
  SETUP_DISCONNECTION: 'SETUP_DISCONNECTION',
  ENABLE: 'ENABLE',
  DISABLE: 'DISABLE',
  SETUP_STATE: 'SETUP_STATE',
  SET_VALUE: 'SET_VALUE',
  REMOVE_CLIENT: 'REMOVE_CLIENT',
  GET_BOUNDING_FOR_STATE: 'GET_BOUNDING_FOR_STATE',
  BOUNDING_FOR_STATE: 'BOUNDING_FOR_STATE',
  SEND_MESSAGE: 'SEND_MESSAGE',
  PREVENT_GAME_CONNECTION: 'PREVENT_GAME_CONNECTION'
} as const


export type RemoteStateType = 'string' | 'number' | 'boolean' | 'color' | {
  type: 'select',
  variants: string[] | { value: string, label: string }[]
}

type RemoteState = {
  type: RemoteStateType,
  value: any,
}

abstract class BaseDebug {
  private connected = new WatchableValue<boolean>(false)
  private enabled = new WatchableValue<boolean>(false)

  get isConnected() {
    return this.connected.readonlyValue
  }

  get isEnabled() {
    return this.enabled.readonlyValue
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
      if (event.data.data.command === COMMANDS.SETUP_CONNECTION) this.connected.value = true
      if (event.data.data.command === COMMANDS.SETUP_DISCONNECTION) this.connected.value = false
      if (event.data.data.command === COMMANDS.ENABLE) this.enabled.value = true
      if (event.data.data.command === COMMANDS.DISABLE) this.enabled.value = false
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
  private connected = new WatchableValue<boolean>(false)
  private enabled = new WatchableValue<boolean>(false)

  get isConnected() {
    return this.connected.readonlyValue
  }

  get isEnabled() {
    return this.enabled.readonlyValue
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
        this.connected.value = true
      }

      this.processCommand(event.data.data.command, event.data.data)
    }
  }

  post(data: any) {
    this.frame.contentWindow?.postMessage({ key: this.key, data }, "*")
  }

  enable() {
    this.enabled.value = true
    this.post({ command: COMMANDS.ENABLE })
  }

  disable() {
    this.enabled.value = false
    this.post({ command: COMMANDS.DISABLE })
  }

  abstract processCommand(command: string, data: any): void;

  dispose() {
    this.post({ command: COMMANDS.SETUP_DISCONNECTION })
    window.removeEventListener('message', this.onMessageFromWidget)
    this.connected.dispose()
  }

}

export class RemoteDebugConnection extends BaseDebugConnection {

  private readonly states = new WatchableValue(new Map<string, RemoteState>())
  private readonly bbox = new WatchableValue(new Map<string, { width: number, height: number, x: number, y: number }>())

  constructor(frame: HTMLIFrameElement) {
    super(frame, REMOTE_DEBUG_KEY)
  }

  get registeredStates() {
    return this.states.readonlyValue
  }

  get boundingBoxes() {
    return this.bbox.readonlyValue
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
      case COMMANDS.BOUNDING_FOR_STATE:
        const { key, bbox } = data;
        this.bbox.value.set(key, bbox);
        this.bbox.trigger();
        break;
    }
  }
}

class Bbox {
  constructor(
    public width: number,
    public height: number,
    public x: number,
    public y: number
  ) { }

  isEqual(other: Bbox): boolean {
    return this.width === other.width &&
      this.height === other.height &&
      this.x === other.x &&
      this.y === other.y;
  }
}

type ElementDef = HTMLElement | (() => HTMLElement | undefined) | string;

function getElementGetter(element: ElementDef) {
  if (typeof element === 'string') {
    return () => document.querySelector<HTMLElement>(element) ?? undefined;
  }
  if (typeof element === 'function') {
    return () => element() ?? undefined;
  }
  return () => element as HTMLElement;
}

export class RemoteDebug extends BaseDebug {

  private readonly lastBBox = new Map<string, Bbox>()
  private readonly bboxTargets = new Map<string, ReturnType<typeof getElementGetter>>()

  private animationCancel: ReturnType<typeof requestAnimationFrame> | null = null;

  constructor(private readonly options: {
    onSetState: (state: Record<string, any>) => void
  }) {
    super(REMOTE_DEBUG_KEY)

    this.isConnected.watch(connected => {
      if (connected) this.animationCancel = requestAnimationFrame(() => this.bboxChecker())
      else if (this.animationCancel) cancelAnimationFrame(this.animationCancel);
    }, { immediate: true });
  }

  private postBbox(key: string, bbox: { width: number, height: number, x: number, y: number } | undefined) {
    this.post({
      command: COMMANDS.BOUNDING_FOR_STATE,
      key,
      bbox
    })
  }

  private bboxChecker() {
    this.animationCancel = requestAnimationFrame(() => this.bboxChecker())

    for (const [key, getter] of this.bboxTargets) {
      const element = getter();
      if (!element) {
        this.lastBBox.delete(key);
        this.postBbox(key, undefined);
        continue;
      }

      const rect = element.getBoundingClientRect();
      const bbox = new Bbox(rect.width, rect.height, rect.left + window.scrollX, rect.top + window.scrollY);
      const last = this.lastBBox.get(key);
      if (!last || !last.isEqual(bbox)) {
        this.lastBBox.set(key, bbox);
        this.postBbox(key, {
          width: bbox.width,
          height: bbox.height,
          x: bbox.x,
          y: bbox.y
        });
      }
    }
  }

  defineRectHelper(key: string, element: ElementDef) {
    this.bboxTargets.set(key, getElementGetter(element));
  }

  defineState(key: string, value: any, type: RemoteStateType, element?: ElementDef) {
    if (element) this.defineRectHelper(key, element)
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

  override dispose(): void {
    super.dispose();
    if (this.animationCancel) cancelAnimationFrame(this.animationCancel);
  }
}

export class SdkDebugConnection extends BaseDebugConnection {
  private gameConnectionPrevented = new WatchableValue<boolean>(false);

  constructor(frame: HTMLIFrameElement) {
    super(frame, SDK_DEBUG_KEY)
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

  sendPreventGameConnection(prevent: boolean) {
    this.gameConnectionPrevented.value = prevent;
    this.post({ command: COMMANDS.PREVENT_GAME_CONNECTION, prevent: prevent });
  }

}

export class SdkDebug extends BaseDebug {
  private gameConnectionPrevented = new WatchableValue<boolean>(false);

  get isGameConnectionPrevented() {
    return this.gameConnectionPrevented.readonlyValue;
  }

  constructor(private callbacks: {
    onMessage: (message: any) => void,
  }) {
    super(SDK_DEBUG_KEY)
  }

  processCommand(command: string, data: any) {
    if (command === COMMANDS.SEND_MESSAGE) {
      if (this.isEnabled.value) this.callbacks.onMessage(data.message);
    } else if (command === COMMANDS.PREVENT_GAME_CONNECTION) {
      this.gameConnectionPrevented.value = data.prevent;
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