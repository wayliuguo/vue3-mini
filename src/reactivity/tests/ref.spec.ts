import { effect } from '../effect'
import { ref } from '../ref'

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
})
