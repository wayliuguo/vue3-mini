import { ref, h } from '../../lib/guide-mini-vue3.esm.js'
const nextChildren = 'newChildren'
const prevChildren = [h('div', {}, 'A'), h('div', {}, 'B')]

export default {
    name: 'ArrayToText',

    setup() {
        const isChange = ref(false)
        // 直接挂载到window上，通过控制台测试
        window.isChange = isChange

        return {
            isChange
        }
    },

    render() {
        const self = this
        return self.isChange === true
            ? h('div', {}, nextChildren)
            : h('div', {}, prevChildren)
    }
}
