import { beforeEach, expect, describe, it, assert } from 'vitest';

import { createDeepProxy, type State, type Trigger, type WatchStateCallback } from "../lib/utils/deepProxy";


describe('deepProxy', () => {

  it('watch update', () => {

    type Test = { a: { b: { c: State<number> } } }

    const { proxy, update } = createDeepProxy<Test>()

    let value = 0
    let oldValue = 0

    const cancel = proxy.a.b.c.watch((v, old) => {
      value = v
      oldValue = old
    })

    proxy.a.b.c.watch((v, old) => { })

    update('a.b.c', 1)
    expect(value).toBe(1)
    expect(oldValue).toBe(undefined)

    update('a.b.c', 2)
    expect(value).toBe(2)
    expect(oldValue).toBe(1)


    update('a.b.c', 3, 5)
    expect(value).toBe(3)
    expect(oldValue).toBe(5)

    cancel()

    update('a.b.c', 0)
    expect(value).toBe(3)
    expect(oldValue).toBe(5)
  })

  it('get value', () => {
    type Test = { a: { b: { c: State<number> } } }

    const { proxy, update } = createDeepProxy<Test>()

    expect(proxy.a.b.c.value()).toBe(undefined)

    update('a.b.c', 1)
    expect(proxy.a.b.c.value()).toBe(1)

    update('a.b.c', 2)
    expect(proxy.a.b.c.value()).toBe(2)


    update('a.b.d', 2)
    expect(proxy.a.b.c.value()).toBe(2)
  })

  it('initial', () => {
    type Test = { a: { b: { c: State<number> } } }

    const { proxy, update } = createDeepProxy<Test>(new Map([['a.b.c', 1]]))

    expect(proxy.a.b.c.value()).toBe(1)

    update('a.b.c', 2)
    expect(proxy.a.b.c.value()).toBe(2)
  })

  it('watch trigger', () => {
    type Test = { a: { b: { c: Trigger<number> } } }

    const { proxy, trigger } = createDeepProxy<Test>()

    let value = 0

    proxy.a.b.c.watch((v) => {
      value = v
    })

    trigger('a.b.c', 1)
    expect(value).toBe(1)

    trigger('a.b.c', 2)
    expect(value).toBe(2)
  })

})