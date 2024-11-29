import { hanChanged, isObject, ReactiveFlags } from '../shared/index'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

class RefImpl {
    // 声明 _value
    private _value: any // 私有value
    public dep: any // 依赖
    private _rawValue: any // 私有原数据
    public [ReactiveFlags.IS_REF]: boolean = true
    constructor(value: any) {
        this._rawValue = value
        this._value = convert(value)
        this.dep = new Set()
    }

    // ref value getter
    get value() {
        trackRefValue(this)
        return this._value
    }

    // ref value setter
    set value(newValue) {
        // 对比当前设置的值与原数据是否有变化
        if (hanChanged(newValue, this._rawValue)) {
            this._rawValue = newValue
            this._value = convert(newValue)
            triggerEffects(this.dep)
        }
    }
}

export function ref(value: any) {
    return new RefImpl(value)
}

/**
 * 判断是否Ref
 * @param ref RefImpl 实例
 * @returns {boolean}
 */
export function isRef(ref: any) {
    return !!ref[ReactiveFlags.IS_REF]
}

// 如果参数是ref，则返回内部值，否则返回参数本身
export function unRef(ref: any) {
    return isRef(ref) ? ref.value : ref
}

//
export function proxyRefs(objectWithRefs: any) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 通过unRef 省略.value
            return unRef(Reflect.get(target, key))
        },

        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                // 如果原来属性是ref，设为非 ref
                // 直接改变其value属性值
                return (target[key].value = value)
            } else {
                return Reflect.set(target, key, value)
            }
        }
    })
}

/**
 * 收集Ref依赖
 * @param ref RefImpl 实例
 */
function trackRefValue(ref: any) {
    if (isTracking()) {
        trackEffects(ref.dep)
    }
}

/**
 * 转换value（）
 * @param value any
 * @returns {any}
 */
function convert(value: any) {
    // 如果 value 是对象，则使用 reactive 处理
    return isObject(value) ? reactive(value) : value
}
