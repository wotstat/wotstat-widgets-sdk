import { WebSocketDataProvider } from "./dataProvider/WebSocketDataProvider";
import { SDK } from "./sdk";

export type Options = Partial<{
  wsHost: string;
  wsPort: number;
}>

export class WidgetsSDK {
  private readonly sdk: SDK<any>;

  constructor(private options: Options) {
    this.sdk = new SDK(new WebSocketDataProvider(options.wsHost ?? 'localhost', options.wsPort ?? 33800));
  }

  async init() {
    await this.sdk.init();
  }

  get data() {
    return this.sdk.data;
  }

}