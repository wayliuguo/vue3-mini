import { isReanonly, readonly } from '../reactive'

describe('readonly', () => {
    it('happy path', () => {
        const original = {
            foo: 1,
            bar: {
                baz: 2
            }
        }
        const wrapped: any = readonly(original)
        expect(wrapped).not.toBe(original)
        // 断言处理后的对象是readonly
        expect(isReanonly(wrapped)).toBe(true)
        expect(isReanonly(wrapped.bar)).toBe(true)
        // 断言原对象非readonly
        expect(isReanonly(original)).toBe(false)
        expect(isReanonly(original.bar)).toBe(false)
        // 断言处理后的对象可访问属性
        expect(wrapped.foo).toBe(1)
    })

    it('warn when call set', () => {
        console.warn = jest.fn()
        const user: any = readonly({
            age: 10
        })
        user.age = 11

        // 断言readonly 对象赋值会触发警告
        expect(console.warn).toHaveBeenCalled()
    })
})
