import { isReactive, reactive } from '../reactive'

describe('effect', () => {
    it('happy path', () => {
        const original = {
            foo: 1
        }
        type observedType = typeof original
        const observed = reactive(original) as observedType

        // 断言处理后对象与原对象不相等
        expect(observed).not.toBe(original)
        // 断言处理后对象属性可正确访问
        expect(observed.foo).toBe(1)
        // 断言处理后的对象是响应式对象，isReactive函数返回正确
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
    })
    test('nested reactive', () => {
        const original = {
            nested: {
                foo: 1
            },
            array: [
                {
                    bar: 2
                }
            ]
        }
        const observed: any = reactive(original)
        // 断言处理后的对象的属性也是响应式的，isReacctive 函数返回正确
        expect(isReactive(observed.nested)).toBe(true)
        expect(isReactive(observed.array)).toBe(true)
        expect(isReactive(observed.array[0])).toBe(true)
    })
})
