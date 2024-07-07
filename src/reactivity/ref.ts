import { hanChanged, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

class RefImpl {
    // 声明 _value
    private _value: any // 私有value
    public dep: any // 依赖
    private _rawValue: any // 私有原数据
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
