import { h } from '../../lib/guide-mini-vue3.esm.js'

export default {
    name: 'Child',
    setup(props, { emit }) {},
    render() {
        return h('div', {}, [
            h('div', {}, 'child - props -msg：' + this.$props.msg)
        ])
    }
}
