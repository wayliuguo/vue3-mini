import { ReactiveEffect } from './effect'

export function computed(getter: any) {
    return new ComputedRefImpl(getter)
}

class ComputedRefImpl {
    private _getter: any // getter 函数
    private _dirty: boolean = true // 是否 dirty
    private _value: any // getter 缓存值
    private _effect: any // effect 函数

    constructor(getter: any) {
        this._getter = getter
        // 通过 effect，使其生成一个 ReactiveEffect 实例
        // 在访问属性时，则调用实例的run函数，这时会收集好依赖
        // 第二个参数设置了 scheduler, 触发依赖时会调用，用于重置 _dirty
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true
            }
        })
    }

    get value() {
        if (this._dirty) {
            // 如果是 dirty的，则调用 ReactiveEffect 实例 run 函数
            this._dirty = false
            this._value = this._effect.run()
        }
        return this._value
    }
}
