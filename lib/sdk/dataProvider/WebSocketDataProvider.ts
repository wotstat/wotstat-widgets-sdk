import { IDataProvider } from ".";
import { InitMessage } from "../types";


export class WebSocketDataProvider implements IDataProvider {

  constructor(private host: string = 'localhost', private port: number = 33200) { }

  async init(): Promise<InitMessage> {
    throw new Error("Method not implemented.");
  }

  onMessageAddListener(listener: (event: any) => void) {
    throw new Error("Method not implemented.");
  }
}