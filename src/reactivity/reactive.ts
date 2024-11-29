import { ReactiveFlags, isObject } from '../shared/index'
import {
    mutableHandlers,
    readonlyHandlers,
    shallowReadonlyHandlers
} from './baseHandlers'

export function reactive(raw: object) {
    return createReactiveObject(raw, mutableHandlers)
}

export function readonly(raw: object) {
    return createReactiveObject(raw, readonlyHandlers)
}

export function shallowReadonly(raw: any) {
    return createReactiveObject(raw, shallowReadonlyHandlers)
}

export function isReactive(value: any) {
    // 如果是非reactive对象，raw[ReactiveFlags.IS_REACTIVE]会得到undefined，这里转成了boolean
    return !!value[ReactiveFlags.IS_REACTIVE]
}

export function isReadonly(value: any) {
    // 强行转为 boolean
    return !!value[ReactiveFlags.IS_READONLY]
}

// 判断是否有 reactive 或 readonly 处理的响应式对象
export function isProxy(value: any) {
    return isReactive(value) || isReadonly(value)
}

function createReactiveObject(raw: object, baseHandlers: any) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`)
        return raw
    }
    return new Proxy(raw, baseHandlers)
}
