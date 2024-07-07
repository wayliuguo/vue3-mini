import { effect } from '../effect'
import { reactive } from '../reactive'
import { isRef, proxyRefs, ref, unRef } from '../ref'

describe('ref', () => {
    it('happy path', () => {
        const a = ref(1)
        expect(a.value).toBe(1)
    })

    it('should be reactive', () => {
        const a: any = ref(1)
        let dummy
        let calls = 0
        // 通过 effect 做依赖收集
        effect(() => {
            calls++
            dummy = a.value
        })
        expect(calls).toBe(1)
        expect(dummy).toBe(1)

        // 验证触发更新
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)

        // 赋值相同，不应该触发更新
        a.value = 2
        expect(calls).toBe(2)
        expect(dummy).toBe(2)
    })

    // 校验 ref 对象属性是 响应式的
    it('should make nested properties reactive', () => {
        const a = ref({
            count: 1
        })
        let dummy
        effect(() => {
            dummy = a.value.count
        })
        expect(dummy).toBe(1)

        a.value.count = 2
        expect(dummy).toBe(2)
    })

    // 校验 isRef
    it('isRef', () => {
        const a = ref(1)
        const user = reactive({
            age: 1
        })

        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })

    // 校验 unRef
    it('unRef', () => {
        const a = ref(1)

        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })

    // 校验 proxyRefs，ref 省略.value取值（如template中）
    it('proxyRefs', () => {
        const user = {
            age: ref(18),
            name: 'well'
        }

        // proxyUser 对象，可以省略.value
        const proxyUser = proxyRefs(user)
        expect(user.age.value).toBe(18)
        expect(proxyUser.age).toBe(18)
        expect(user.name).toBe('well')
        expect(proxyUser.name).toBe('well')

        // proxyRefs 处理后，原属性是ref变为基本类型
        proxyUser.age = 20
        expect(proxyUser.age).toBe(20)
        expect(user.age.value).toBe(20)

        // proxyRefs 处理后，原属性是基本类型变为ref
        proxyUser.age = ref(20)
        expect(proxyUser.age).toBe(20)
        expect(user.age.value).toBe(20)
    })
})
