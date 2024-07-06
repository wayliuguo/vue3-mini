import { ReactiveFlags } from '../shared'
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from './baseHandlers'

export function reactive(raw: object) {
    return createReactiveObject(raw, mutableHandlers)
}

export function readonly(raw: object) {
    return createReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any) {
    return createReactiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(raw: any) {
    // 如果是非reactive对象，raw[ReactiveFlags.IS_REACTIVE]会得到undefined，这里转成了boolean
    return !!raw[ReactiveFlags.IS_REACTIVE]
}

export function isReanonly(raw: any) {
    // 强行转为 boolean
    return !!raw[ReactiveFlags.IS_READONLY]
}

function createReactiveObject(raw: object, baseHandlers: any) {
    return new Proxy(raw, baseHandlers)
}
