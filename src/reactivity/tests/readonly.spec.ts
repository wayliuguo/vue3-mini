import { isProxy, isReadonly, readonly } from '../reactive'

describe('readonly', () => {
    it('happy path', () => {
        const original = {
            foo: 1,
            bar: {
                baz: 2
            }
        }
        const wrapped: any = readonly(original)
        // 断言处理前后两对象非同一个对象
        expect(wrapped).not.toBe(original)

        // 验证  isReaonly
        // 断言处理后的对象及其属性是readonly
        expect(isReadonly(wrapped)).toBe(true)
        expect(isReadonly(wrapped.bar)).toBe(true)
        // 断言原对象及其属性非readonly
        expect(isReadonly(original)).toBe(false)
        expect(isReadonly(original.bar)).toBe(false)

        // 断言处理后的对象可访问属性
        expect(wrapped.foo).toBe(1)

        // 验证 isProxy
        // 断言isProxy函数处理readonly对象返回正确
        expect(isProxy(wrapped)).toBe(true)
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
