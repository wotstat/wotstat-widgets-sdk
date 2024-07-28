import { createDeepProxy } from "../utils/deepProxy";
import { IDataProvider } from "./dataProvider";
import { ChangeStateMessage, TriggerMessage } from "./types";


export class SDK<T extends object> {

  private dataProxy: ReturnType<typeof createDeepProxy<T>> | null = null
  private isInitialized = false

  constructor(private dataProvider: IDataProvider) {
    dataProvider.onMessageAddListener(this.onMessage.bind(this));
  }

  async init() {
    const initData = await this.dataProvider.init();
    console.log('Received init data', initData);

    const initial = new Map<string, any>(initData.states.map(({ path, value }) => [path, value]));
    this.dataProxy = createDeepProxy(initial);
    this.isInitialized = true;
  }

  private onMessage(event: ChangeStateMessage | TriggerMessage) {
    if (event.type === 'state') {
      this.dataProxy?.update(event.path, event.value);
    } else if (event.type === 'trigger') {
      this.dataProxy?.trigger(event.path, event.value);
    }
  }

  get data() {
    if (!this.dataProxy || !this.isInitialized) throw new Error("SDK is not initialized");

    return this.dataProxy.proxy;
  }
}