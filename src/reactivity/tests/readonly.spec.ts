import { readonly } from '../reactive'

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
        expect(wrapped.foo).toBe(1)
    })

    it('warn when call set', () => {
        console.warn = jest.fn()
        const user: any = readonly({
            age: 10
        })
        user.age = 11

        expect(console.warn).toHaveBeenCalled()
    })
})
