import { extend, isObject, ReactiveFlags } from '../shared/index'
import { track, trigger } from './effect'
import { reactive, readonly } from './reactive'

// reactive getter 和 setter
const get = createGetter()
const set = createSetter()

// readonly getter
const readonlyGet = createGetter(true)

// shallowReadonly getter
const shallowReadonlyGet = createGetter(true, true)

/**
 * 生成 getter 函数
 * @param isReadonly boolean 是否仅读的
 * @param isShallow boolean 是否仅浅层是响应式的
 * @returns  {Function}
 */
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target: object, key: string | symbol) {
        // 如果获取的key 是 is_reactive，则用于判断是否是响应式对象
        if (key === ReactiveFlags.IS_REACTIVE) {
            return !isReadonly
        } else if (key === ReactiveFlags.IS_READONLY) {
            return isReadonly
        }

        const res = Reflect.get(target, key)

        // 如果是浅层代理，则直接返回 res
        if (isShallow) {
            return res
        }

        // 如果 res 是对象，再次递归处理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res)
        }

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

// shallowReadonlyHandlers proxy handler
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
})
