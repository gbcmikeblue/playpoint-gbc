/**
 * 极简响应式 store（替代 mobx，零运行时依赖）。
 * 用法：const s = createStore({ n: 1 }); s.set({ n: 2 }); s.subscribe(fn)
 */
type Listener = () => void

export interface Store<T extends object> {
  readonly state: T
  set(patch: Partial<T>): void
  subscribe(fn: Listener): () => void
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial
  const listeners = new Set<Listener>()
  return {
    get state() {
      return state
    },
    set(patch: Partial<T>) {
      state = { ...state, ...patch }
      listeners.forEach((fn) => fn())
    },
    subscribe(fn: Listener) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

/** 页面/组件绑定：把 store 的部分字段自动同步到 data */
export function bindStore<T extends object>(
  ctx: any,
  store: Store<T>,
  fields: (keyof T)[],
) {
  const sync = () => {
    const patch: Record<string, any> = {}
    fields.forEach((f) => (patch[f as string] = (store.state as any)[f]))
    ctx.setData(patch)
  }
  sync()
  const unsub = store.subscribe(sync)
  const originOnUnload = ctx.onUnload
  ctx.onUnload = function () {
    unsub()
    originOnUnload && originOnUnload.call(this)
  }
  return unsub
}
