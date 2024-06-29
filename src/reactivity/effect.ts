import { extend } from '../shared'

// 收集依赖的 weakMap 对象
const targetMap = new WeakMap()
// 当前的 effect
let activeEffect: any

/**
 * 收集依赖,由proxy对象getter触发，构建的数据如下：
 * weakMap{target: Map}
 * Map{key: Set}
 * Set{key: effect1, key: effect2}
 * @param target proxy 对象
 * @param key proxy 对象 key
 */
export function track(target: object, key: string | symbol) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }
    let dep = depsMap.get(key)
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }

    if (!activeEffect) return

    dep.add(activeEffect)
    // activeEffect 的 deps 收集 dep
    activeEffect.deps.push(dep)
}

/**
 * 触发依赖，由proxy对象setter触发
 * 从 targetMap 中取出收集的依赖（effect 函数），进行执行
 * @param target proxy 对象
 * @param key proxy 对象 key
 */
export function trigger(target: object, key: string | symbol) {
    let depsMap = targetMap.get(target)
    let dep = depsMap.get(key)

    for (const effect of dep) {
        // 如果effect 有设置 sceduler,则执行scheduler，否则执行effect
        if (effect.scheduler) {
            effect.scheduler()
        } else {
            effect.run()
        }
    }
}

export function effect(fn: Function, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    // 融合所有属性
    extend(_effect, options)

    _effect.run()

    // 优化前： _effect.run.bind(_effect) 以当前ReactiveEffect实例作为this指向，并返回该effect可执行函数
    // 优化后：定义处使用了箭头函数，无需指定绑定
    const runner: any = _effect.run
    runner.effect = _effect

    return runner
}

type Scheduler = (...args: any[]) => void
class ReactiveEffect {
    private _fn: Function // effect 执行函数
    public scheduler?: Scheduler // effect 调度器
    deps = [] //
    active = true
    onStop?: () => void

    constructor(fn: Function, scheduler: Scheduler) {
        this._fn = fn
        this.scheduler = scheduler
    }

    // 使用箭头函数优化，其指向会绑定在ReactiveEffect实例上
    run = () => {
        activeEffect = this
        return this._fn()
    }
    /* run() {
        activeEffect = this
        return this._fn()
    } */

    stop = () => {
        if (this.active) {
            cleanUpEffect(this)
            this.active = false
            if (this.onStop) {
                this.onStop()
            }
        }
    }
}

// 清空 effect
function cleanUpEffect(effect: any) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
}

export function stop(runner: any) {
    runner.effect.stop()
}
