import { beforeEach, afterEach, expect, describe, it, vi } from 'vitest'

import { WebSocketServer } from 'ws'
import { WebSocketDataProvider } from "../lib/sdk/dataProvider/WebSocketDataProvider"


describe('WebSocketDataProvider', () => {

  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.restoreAllMocks() })

  it.concurrent('Init after WOT', { timeout: 1000 }, async () => {
    const port = 33200
    const dp = new WebSocketDataProvider('localhost', port)
    const server = new WebSocketServer({ port })

    const initPromise = dp.init()

    await vi.waitUntil(() => server.clients.size === 1)

    server.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'init', states: [{ path: 'a.b.c', value: 1 }] }))
    })

    const initData = await initPromise

    expect(initData.states).toEqual([{ path: 'a.b.c', value: 1 }])

  })

  it.concurrent('Init before WOT', { timeout: 1000 }, async () => {
    const port = 33201
    const dp = new WebSocketDataProvider('localhost', port)

    await expect(() => dp.init()).rejects.toThrowError()
  })

  it.concurrent('Connection lost', { timeout: 1000 }, async () => {
    const port = 33202
    const dp = new WebSocketDataProvider('localhost', port)
    const server = new WebSocketServer({ port })

    const initPromise = dp.init()

    await vi.waitUntil(() => server.clients.size === 1)

    server.clients.forEach(client => {
      client.send(JSON.stringify({ type: 'init', states: [{ path: 'a.b.c', value: 1 }] }))
    })

    const initData = await initPromise

    expect(initData.states).toEqual([{ path: 'a.b.c', value: 1 }])

    server.clients.forEach(client => {
      client.close()
    })

    // await expect(() => initPromise).rejects.toThrowError()

    // await expect(() => initPromise).rejects.toThrow
  })

})