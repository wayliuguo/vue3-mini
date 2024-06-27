import { effect } from '../effect'
import { reactive } from '../reactive'

describe('effect', () => {
    // 验证effect 与依赖收集&触发更新
    it('happy path', () => {
        const user: any = reactive({
            age: 10
        })
        let nextAge
        effect(() => {
            nextAge = user.age + 1
        })
        expect(nextAge).toBe(11)

        // update
        user.age++
        expect(nextAge).toBe(12)
    })

    // 验证 effect 指向应该要返回一个可执行函数
    it('should return runner when call effect', () => {
        let foo = 10
        const runner = effect(() => {
            foo++
            return 'effect_foo'
        })
        expect(foo).toBe(11)
        const r = runner()
        expect(foo).toBe(12)
        expect(r).toBe('effect_foo')
    })
    // 验证 effect 的 scheduler(调度器)
    // 1. 通过 effect 的第二个参数指定一个 scheduler(函数)
    // 2. effect 第一次执行的时候，会立即执行其第一个参数 fn
    // 3. 当响应式对象 setter 触发更新时候，如果有指定 scheduler, 执行 scheduler, 否则执行fn
    // 4. 当执行runner(effect执行的返回的可执行函数)，会再次执行effect 第一个参数 fn
    it('scheduler', () => {
        let dummy
        let run: any
        const scheduler = jest.fn(() => {
            run = runner
        })
        const obj: any = reactive({ foo: 1 })
        const runner = effect(
            () => {
                dummy = obj.foo
            },
            { scheduler }
        )

        // 期望effect 首次执行，scheduler 不会被执行
        expect(scheduler).not.toHaveBeenCalled()
        // 期望effect 首次执行 fn
        expect(dummy).toBe(1)

        // 期望 setter 触发更新的时候，执行 scheduler
        obj.foo++
        expect(scheduler).toHaveBeenCalledTimes(1)
        expect(dummy).toBe(1)

        run()
        expect(dummy).toBe(2)
    })
})
