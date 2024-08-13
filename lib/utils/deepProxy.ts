
export type WatchStateCallback<T> = (value: T, old: T) => void
export type WatchState<T> = (callback: WatchStateCallback<T>, options?: { immediate: boolean }) => (() => void)

export type State<T> = {
  value: T | undefined,
  watch: WatchState<T>
}

export type WatchTriggerCallback<T> = (value: T) => void
export type WatchTrigger<T> = (callback: WatchTriggerCallback<T>) => (() => void)

export type Trigger<T> = {
  watch: WatchTrigger<T>
}

export type DeepProxy<T> = {
  [P in keyof T]: T[P] extends State<infer _> ? T[P] : T[P] extends Trigger<infer _> ? T[P] : DeepProxy<T[P]>
}

export function createDeepProxy<T extends object>(initial: Map<string, any> = new Map()) {

  const keyValue = new Map<string, any>(initial)
  const listeners = new Map<string, Set<WatchStateCallback<any> | WatchTriggerCallback<any>>>()

  function makeHandler(path: string): ProxyHandler<T> {
    return {
      get(target, p, receiver) {
        if (p === 'value') return keyValue.get(path)
        if (p === 'watch') return ((callback: WatchStateCallback<T>, options?: { immediate: boolean }) => {
          if (listeners.has(path)) listeners.get(path)!.add(callback)
          else listeners.set(path, new Set([callback]))

          if (options?.immediate) callback(keyValue.get(path), keyValue.get(path))

          return () => {
            listeners.get(path)!.delete(callback)
            if (listeners.get(path)!.size === 0) listeners.delete(path)
          }
        }) as WatchState<T>


        const nextPath = path == '' ? p.toString() : `${path}.${p.toString()}`
        return new Proxy({}, makeHandler(nextPath))
      },
    }
  }

  const notSet = Symbol('notSet')
  function update(path: string, value: any, old: any = notSet) {
    const oldValue = old == notSet ? keyValue.get(path) : old
    keyValue.set(path, value)

    const callbacks = listeners.get(path)

    if (!callbacks) return

    for (const iterator of callbacks) {
      (iterator as WatchStateCallback<any>)(value, oldValue)
    }
  }

  function trigger(path: string, value: any) {
    const callbacks = listeners.get(path)

    if (!callbacks) return

    for (const iterator of callbacks) {
      (iterator as WatchTriggerCallback<any>)(value)
    }

  }

  function resetup(initial: Map<string, any> = new Map()) {
    for (const [key, value] of keyValue.entries()) {
      if (!initial.has(key)) {
        update(key, undefined)
      } else {
        update(key, initial.get(key))
      }
    }

    for (const [key, value] of initial.entries()) {
      if (!keyValue.has(key)) {
        update(key, value)
      }
    }
  }

  return {
    proxy: new Proxy(keyValue as any, makeHandler('')) as DeepProxy<T>, update, trigger, resetup
  }
}
