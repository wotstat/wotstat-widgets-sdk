
export type WatchStateCallback<T> = (value: T, old: T) => void
export type WatchState<T> = (callback: WatchStateCallback<T>) => (() => void)

export type State<T> = {
  value: () => T | undefined,
  watch: WatchState<T>
}

export type WatchTrigger<T> = (callback: (value: T) => void) => (() => void)

export type Trigger<T> = {
  watch: WatchTrigger<T>
}

export type DeepProxy<T> = {
  [P in keyof T]: T[P] extends State<infer _> ? T[P] : T[P] extends Trigger<infer _> ? T[P] : DeepProxy<T[P]>
}

export function createDeepProxy<T extends object>(initial: Map<string, any> = new Map()) {

  const keyValue = new Map<string, any>(initial)
  const listeners = new Map<string, Set<WatchStateCallback<any>>>()

  function makeHandler(path: string): ProxyHandler<T> {
    return {
      get(target, p, receiver) {
        if (p === 'value') return () => keyValue.get(path)
        if (p === 'watch') return ((callback: WatchStateCallback<T>) => {
          if (listeners.has(path)) listeners.get(path)!.add(callback)
          else listeners.set(path, new Set([callback]))

          return () => {
            listeners.get(path)!.delete(callback)
            if (listeners.get(path)!.size === 0) listeners.delete(path)
          }
        }) as WatchState<T>

        return new Proxy({}, makeHandler(path == '' ? p.toString() : `${path}.${p.toString()}`))
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
      iterator(value, oldValue)
    }
  }

  function trigger(path: string, value: any) {
    const callbacks = listeners.get(path)

    if (!callbacks) return

    for (const iterator of callbacks) {
      iterator(value, value)
    }

  }

  return { proxy: new Proxy({}, makeHandler('')) as DeepProxy<T>, update, trigger }
}
