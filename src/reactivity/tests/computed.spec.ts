import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
    it('happy path', () => {
        const user: any = reactive({
            age: 18
        })
        const age: any = computed(() => {
            return user.age
        })
        expect(age.value).toBe(18)
    })

    it('should compute lazily', () => {
        const value: any = reactive({
            foo: 1
        })
        const getter = jest.fn(() => {
            return value.foo
        })
        const cValue = computed(getter)
        // 校验computed 懒执行(未访问计算属性时，未调用computed参数里的函数)
        expect(getter).not.toHaveBeenCalled()

        // 访问了计算属性，调用computed参数里的函数
        expect(cValue.value).toBe(1)
        expect(getter).toHaveBeenCalledTimes(1)

        // 再次访问计算属性，不再调用computed参数里的函数
        cValue.value
        expect(getter).toHaveBeenCalledTimes(1)

        // 计算属性依赖变更后，还未访问计算属性，则还未调用computed参数里的函数
        value.foo = 2
        expect(getter).toHaveBeenCalledTimes(1)

        // 计算属性依赖变更后，访问了计算属性，会调用computed参数里的函数
        expect(cValue.value).toBe(2)
        expect(getter).toHaveBeenCalledTimes(2)

        cValue.value
        expect(getter).toHaveBeenCalledTimes(2)
    })
})
