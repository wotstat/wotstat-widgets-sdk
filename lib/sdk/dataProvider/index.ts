import { ChangeStateMessage, InitMessage, TriggerMessage } from "../types";

export interface IDataProvider {
  init(): Promise<InitMessage>;
  onMessageAddListener(listener: (event: ChangeStateMessage | TriggerMessage) => void): void;
}