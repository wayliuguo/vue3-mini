import { effect } from '../effect'
import { reactive } from '../reactive'
import { isRef, ref, unRef } from '../ref'

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

    it('isRef', () => {
        const a = ref(1)
        const user = reactive({
            age: 1
        })

        expect(isRef(a)).toBe(true)
        expect(isRef(1)).toBe(false)
        expect(isRef(user)).toBe(false)
    })

    it('unRef', () => {
        const a = ref(1)

        expect(unRef(a)).toBe(1)
        expect(unRef(1)).toBe(1)
    })
})
