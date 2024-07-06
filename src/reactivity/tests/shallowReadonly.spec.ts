import { isReadonly, shallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
    it('should not make non-reactive properities reactive', () => {
        const props: any = shallowReadonly({
            n: {
                foo: 1
            }
        })

        // 断言处理后的对象是 readonly
        expect(isReadonly(props)).toBe(true)
        // 断言处理后的对象的属性非 readonly
        expect(isReadonly(props.n)).toBe(false)
    })

    it('warn when call set', () => {
        console.warn = jest.fn()
        const user: any = shallowReadonly({
            age: 10
        })
        user.age = 11

        // 断言readonly 对象赋值会触发警告
        expect(console.warn).toHaveBeenCalled()
    })
})
