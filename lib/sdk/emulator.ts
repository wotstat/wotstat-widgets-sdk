import { WidgetsSdkData } from "./dataTypes";
import { SDK } from "./sdk";
import { ChangeStateMessage, InitMessage, TriggerMessage } from "./types";

class DataProviderState<T> {
  constructor(private path: string, private value: T | undefined, private onUpdate: (value: T) => void) { }

  get() {
    return this.value;
  }

  set(value: T) {
    if (this.value === value) return;
    this.value = value;
    this.onUpdate(value);
  }
}

class DataProviderTrigger<T> {
  constructor(private path: string, private onUpdate: (value: T) => void) { }

  trigger(value: T) {
    this.onUpdate(value);
  }
}


export class DataProviderEmulator<T extends WidgetsSdkData> {
  public api = {
    connect: () => this.connect(),
    connectAndInit: (initialData: Record<string, any> | undefined) => this.connectAndInit(initialData),
    disconnect: () => this.disconnect(),
    onInit: (initialData: Record<string, any> | undefined) => this.onInit(initialData),
    createState: (path: string, value: any) => this.createState(path, value),
    createTrigger: (path: string) => this.createTrigger(path),
    changeState: (path: string, value: any) => this.changeState(path, value),
    trigger: (path: string, value: any) => this.trigger(path, value),
    registerExtension: (extension: string) => this.registerExtension(extension),
  }

  private registeredExtensions: DataProviderState<string[]> | undefined;

  constructor(sdk: SDK<T>,
    private onMessage: (message: any) => void,
    private onConnect: () => void,
    private onDisconnect: () => void) {
  }

  connect() {
    this.onConnect();
  }

  connectAndInit(initialData: Record<string, any> | undefined) {
    this.onConnect();
    this.onInit(initialData);
    this.registeredExtensions = new DataProviderState<string[]>('registeredExtensions', [], (value) => {
      this.onMessage({ type: 'state', path: 'registeredExtensions', value } as ChangeStateMessage);
    });
  }

  disconnect() {
    this.onDisconnect();
  }

  onInit(initialData: Record<string, any> | undefined) {
    const states = initialData ? Object.entries(initialData).map(([path, value]) => ({ path, value })) : [];
    this.onMessage({ type: 'init', states: states } as InitMessage);
  }

  createState(path: string, value: any) {
    const state = new DataProviderState(path, value, (value) => {
      this.onMessage({ type: 'state', path, value } as ChangeStateMessage);
    });

    return {
      get: () => state.get(),
      set: (value: any) => state.set(value),
    }
  }

  createTrigger(path: string) {
    const trigger = new DataProviderTrigger(path, (value) => {
      this.onMessage({ type: 'trigger', path, value } as TriggerMessage);
    });

    return {
      trigger: (value: any) => trigger.trigger(value),
    }
  }

  registerExtension(extension: string) {
    if (!this.registeredExtensions) return;
    this.registeredExtensions.set([...this.registeredExtensions.get()!, extension]);
  }

  changeState(path: string, value: any) {
    this.onMessage({ type: 'state', path, value } as ChangeStateMessage);
  }

  trigger(path: string, value: any) {
    this.onMessage({ type: 'trigger', path, value } as TriggerMessage);
  }

}