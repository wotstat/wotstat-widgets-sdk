import { beforeEach, expect, describe, it, vi } from 'vitest';
import { SDK } from '../lib/sdk/sdk';
import { IDataProvider } from '../lib/sdk/dataProvider';
import { InitMessage, ChangeStateMessage, TriggerMessage } from '../lib/sdk/types';
import { State, Trigger } from '../lib/utils/deepProxy';

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

  updateState(path: string, value: any): void {
    this.listeners.forEach(listener => listener({ type: 'state', path, value }))
  }

  trigger(path: string, value: any): void {
    this.listeners.forEach(listener => listener({ type: 'trigger', path, value }))
  }
}

type Context = {
  provider: FakeDataProvider, sdk: SDK<{
    a: {
      b: State<{ c: number }>
      t: Trigger<{ c: number }>
    }
  }>
}

describe.todo<Context>('init', ctx => {

  beforeEach<Context>(ctx => {
    ctx.provider = new FakeDataProvider();
    ctx.sdk = new SDK(ctx.provider)
  })

  const initMessage: InitMessage = { type: 'init', states: [{ path: 'a.b', value: { c: 1 } }] };

  it<Context>('Check init', async (ctx) => {
    const initPromise = ctx.sdk.init()
    ctx.provider.initResolve(initMessage);
    await initPromise;
  });

  it<Context>('Check init reject', async (ctx) => {
    const initFn = vi.spyOn(ctx.provider, 'init');
    const initPromise = ctx.sdk.init()

    await vi.waitUntil(() => initFn.mock.calls.length === 1);
    ctx.provider.initReject('error');
    await vi.waitUntil(() => initFn.mock.calls.length === 2);
    ctx.provider.initReject('error');
    await vi.waitUntil(() => initFn.mock.calls.length === 3);
    ctx.provider.initResolve(initMessage);
    await initPromise;
  });

  describe<Context>('Checks', ctx => {

    beforeEach<Context>(async ctx => {
      ctx.provider = new FakeDataProvider();
      ctx.sdk = new SDK(ctx.provider)
      const initPromise = ctx.sdk.init()
      ctx.provider.initResolve(initMessage);
      await initPromise;
    })

    it<Context>('Check init value', async (ctx) => {
      expect(ctx.sdk.data.a.b.value()).toEqual({ c: 1 });
    });

    it<Context>('Check trigger', async (ctx) => {
      const fn = vi.fn()
      const cancel = ctx.sdk.data.a.t.watch(fn);


      expect(fn).toHaveBeenCalledTimes(0);

      ctx.provider.trigger('a.t', { c: 1 });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith({ c: 1 });


      ctx.provider.trigger('a.t', { c: 2 });
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith({ c: 2 });

      cancel();

      ctx.provider.trigger('a.t', { c: 3 });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it<Context>('Check state', async (ctx) => {
      const fn = vi.fn()
      const cancel = ctx.sdk.data.a.b.watch(fn);


      expect(fn).toHaveBeenCalledTimes(0);

      ctx.provider.updateState('a.b', { c: 2 });

      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenLastCalledWith({ c: 2 }, { c: 1 });

      ctx.provider.updateState('a.b', { c: 3 });
      expect(fn).toHaveBeenCalledTimes(2);
      expect(fn).toHaveBeenLastCalledWith({ c: 3 }, { c: 2 });

      cancel();

      ctx.provider.updateState('a.b', { c: 3 });
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it<Context>('Check state change value', async (ctx) => {
      expect(ctx.sdk.data.a.b.value()).toEqual({ c: 1 });

      ctx.provider.updateState('a.b', { c: 2 });

      expect(ctx.sdk.data.a.b.value()).toEqual({ c: 2 });
    });
  })

});