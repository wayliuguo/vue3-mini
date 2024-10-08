import { ref, h } from '../../lib/guide-mini-vue3.esm.js'

const prevChildren = 'oldChild'
const nextChildren = 'newChild'

export default {
    name: 'TextToText',
    setup() {
        const isChange = ref(false)
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
