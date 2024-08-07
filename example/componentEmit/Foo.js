import { h, renderSlots } from '../../lib/guide-mini-vue3.esm.js'
export const Foo = {
    name: 'Foo',
    setup() {},
    render() {
        const foo = h('p', {}, 'foo')
        const age = 18

        return h('div', {}, [
            // 具名插槽+作用域插槽
            renderSlots(this.$slots, 'header', {
                age
            }),
            foo,
            // 具名插槽
            renderSlots(this.$slots, 'footer')
        ])
    }
}
