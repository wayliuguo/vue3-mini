import { mutableHandlers, readonlyHandlers } from './baseHandlers'

export function reactive(raw: object) {
    return createActiveObject(raw, mutableHandlers)
}

export function readonly(raw: object) {
    return createActiveObject(raw, readonlyHandlers)
}

function createActiveObject(raw: object, baseHandlers: any) {
    return new Proxy(raw, baseHandlers)
}
