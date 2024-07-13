import { h } from '../../lib/guide-mini-vue3.esm.js'
export const App = {
    render() {
        return h(
            'div',
            {
                id: 'root',
                class: ['red', 'hard']
            },
            // 单个
            // 'hi,' + this.msg
            // 多个
            [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
        )
    },

    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}
