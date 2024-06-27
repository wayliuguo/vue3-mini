import { reactive } from '../reactive'

describe('effect', () => {
    it('happy path', () => {
        const original = {
            foo: 1
        }
        type observedType = typeof original
        const observed = reactive(original) as observedType

        expect(observed).not.toBe(original)
        expect(observed.foo).toBe(1)
    })
})
