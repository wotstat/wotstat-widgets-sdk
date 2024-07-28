import { beforeEach, expect, describe, it } from 'vitest';
import { SDK } from '../lib/sdk/sdk';
import { IDataProvider } from '../lib/sdk/dataProvider';
import { InitMessage, ChangeStateMessage, TriggerMessage } from '../lib/sdk/types';

class FakeDataProvider implements IDataProvider {

  public initResolve: (value: InitMessage) => void;
  public initReject: (reason?: any) => void;

  public listeners: ((event: ChangeStateMessage | TriggerMessage) => void)[] = [];


  init(): Promise<InitMessage> {
    return new Promise((resolve, reject) => {
      this.initResolve = resolve;
      this.initReject = reject;
    })
  }

  onMessageAddListener(listener: (event: ChangeStateMessage | TriggerMessage) => void): void {
    this.listeners.push(listener);
  }
}

type Context = { provider: FakeDataProvider, sdk: SDK }

describe<Context>('init', ctx => {

  beforeEach<Context>(ctx => {
    ctx.provider = new FakeDataProvider();
    ctx.sdk = new SDK(ctx.provider)
  })

  const initMessage: InitMessage = { type: 'init', states: [{ path: ['test'], value: 1 }] };

  it<Context>('Check init', async (ctx) => {
    const initPromise = ctx.sdk.init()
    ctx.provider.initResolve(initMessage);
    await initPromise;
  });

});