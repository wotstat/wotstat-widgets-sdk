import { beforeEach, afterEach, expect, describe, it, vi } from 'vitest';
import { WebSocketServer } from 'ws'
import { SDK } from '../lib/sdk/sdk'
import { State, Trigger } from '../lib/utils/deepProxy';

type Data = {
  a: {
    b: {
      c: State<{ d: number }>,
      t: Trigger<{ d: number }>,
      clearTrigger: Trigger<null>
    }
  }
}

type Context = {
  wss: WebSocketServer
  port: number,
  sdk: SDK<Data>
}

describe<Context>('Messages', ctx => {
  let port = 32000

  beforeEach<Context>(async ctx => {
    ctx.wss = new WebSocketServer({ port: ++port })
    ctx.port = port
    ctx.sdk = new SDK({ wsPort: port })
    await vi.waitUntil(() => ctx.wss.clients.size === 1)
  })

  afterEach(() => {
  })

  function sendInit(wss: WebSocketServer, states: { path: string, value: any }[]) {
    wss.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'init', states }))
    })
  }

  function sendUpdate(wss: WebSocketServer, path: string, value: any) {
    wss.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'state', path, value }))
    })
  }

  function sendTrigger(wss: WebSocketServer, path: string, value: any) {
    wss.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'trigger', path, value }))
    })
  }


  it.concurrent<Context>('Reinit value', async ctx => {
    expect(ctx.sdk.data.a.b.c.value).toBe(undefined)
    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 1 } }])

    await vi.waitUntil(() => ctx.sdk.data.a.b.c.value?.d === 1)
    expect(ctx.sdk.data.a.b.c.value?.d).toBe(1)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 2 } }])

    await vi.waitUntil(() => ctx.sdk.data.a.b.c.value?.d === 2)
    expect(ctx.sdk.data.a.b.c.value?.d).toBe(2)
  })

  it.concurrent<Context>('Reinit watch', async ctx => {
    const fn = vi.fn()
    ctx.sdk.data.a.b.c.watch(fn)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 1 } }])

    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith({ d: 1 }, undefined)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 2 } }])

    await vi.waitUntil(() => fn.mock.calls.length === 2)
    expect(fn).toHaveBeenCalledWith({ d: 2 }, { d: 1 })
  })

  it.concurrent<Context>('State changing', async ctx => {
    const fn = vi.fn()
    ctx.sdk.data.a.b.c.watch(fn)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 1 } }])

    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith({ d: 1 }, undefined)
    expect(ctx.sdk.data.a.b.c.value?.d).toBe(1)

    sendUpdate(ctx.wss, 'a.b.c', { d: 2 })

    await vi.waitUntil(() => fn.mock.calls.length === 2)
    expect(fn).toHaveBeenCalledWith({ d: 2 }, { d: 1 })
    expect(ctx.sdk.data.a.b.c.value?.d).toBe(2)
  })

  it.concurrent<Context>('Trigger', async ctx => {
    const fn = vi.fn()
    ctx.sdk.data.a.b.t.watch(fn)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 1 } }])

    await vi.waitUntil(() => ctx.sdk.status === 'ready')

    sendTrigger(ctx.wss, 'a.b.t', { d: 2 })
    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith({ d: 2 })

    sendTrigger(ctx.wss, 'a.b.t', { d: 3 })
    await vi.waitUntil(() => fn.mock.calls.length === 2)
    expect(fn).toHaveBeenCalledWith({ d: 3 })
  })

  it.concurrent<Context>('Clear trigger', async ctx => {
    const fn = vi.fn()
    ctx.sdk.data.a.b.clearTrigger.watch(fn)

    sendInit(ctx.wss, [{ path: 'a.b.c', value: { d: 1 } }])

    await vi.waitUntil(() => ctx.sdk.status === 'ready')

    sendTrigger(ctx.wss, 'a.b.clearTrigger', null)
    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith(null)

  })

});

describe('Init', () => {

  function sendInit(wss: WebSocketServer) {
    wss.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'init', states: [{ path: 'a.b.c', value: 1 }] }))
    })
  }

  it.concurrent('Init after server', async () => {
    const fn = vi.fn()

    const port = 33200
    const wss = new WebSocketServer({ port })

    const sdk = new SDK({ wsPort: port })
    sdk.onStatusChange(fn)

    await vi.waitUntil(() => wss.clients.size === 1)
    sendInit(wss)

    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith('ready')
  })

  it.concurrent('Init before server', async () => {
    const fn = vi.fn()

    const port = 33201

    const sdk = new SDK({ wsPort: port })
    sdk.onStatusChange(fn)

    expect(sdk.status).toBe('connecting')

    const wss = new WebSocketServer({ port })

    await vi.waitUntil(() => wss.clients.size === 1)
    sendInit(wss)

    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith('ready')
  })

  it.concurrent('Reconnecting', async () => {
    const fn = vi.fn()

    const port = 33202
    const wss = new WebSocketServer({ port })

    const sdk = new SDK({ wsPort: port })
    sdk.onStatusChange(fn)

    await vi.waitUntil(() => wss.clients.size === 1)
    sendInit(wss)

    await vi.waitUntil(() => fn.mock.calls.length === 1)
    expect(fn).toHaveBeenCalledWith('ready')

    wss.clients.forEach(client => client.close())
    wss.close()

    await vi.waitUntil(() => fn.mock.calls.length === 2)
    expect(fn).toHaveBeenCalledWith('connecting')

    const wss2 = new WebSocketServer({ port })
    await vi.waitUntil(() => wss2.clients.size === 1)
    sendInit(wss2)

    await vi.waitUntil(() => fn.mock.lastCall?.[0] === 'ready')

    expect(fn).toHaveBeenCalledTimes(3)
  })

})