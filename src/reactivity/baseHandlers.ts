import { ReactiveFlags } from '../shared'
import { track, trigger } from './effect'

// reactive getter 和 setter
const get = createGetter()
const set = createSetter()

// readonly getter
const readonlyGet = createGetter(true)

/**
 * 生成 getter 函数
 * @param isReadonly boolean 是否仅读的
 * @returns {Function}
 */
function createGetter(isReadonly = false) {
    return function get(target: object, key: string | symbol) {
        // 如果获取的key 是 is_reactive，则用于判断是否是响应式对象
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }

        const res = Reflect.get(target, key)

        if (!isReadonly) {
            // 收集依赖
            track(target, key)
        }

        return res
    }
}

/**
 * 生成 setter 函数
 * @returns
 */
function createSetter() {
    return function set(target: object, key: string | symbol, value: any) {
        const res = Reflect.set(target, key, value)
        // 触发更新
        trigger(target, key)
        return res
    }
}

//  reactive proxy handler
export const mutableHandlers = {
    get,
    set
}

// reaonly proxy handler
export const readonlyHandlers = {
    get: readonlyGet,
    set(target: object, key: string, value: any) {
        console.warn(`key:${key} set failed because target is readonly`, target)
        return true
    }
}
