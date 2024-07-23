import { h } from '../../lib/guide-mini-vue3.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
    name: 'APP',
    render() {
        // 可以在控制台通过 self.$el 获取组件实例
        window.self = this
        return h(
            'div',
            {
                id: 'root',
                class: ['red', 'hard'],
                onClick() {
                    console.log('click')
                },
                onMousedown() {
                    console.log('mousedown')
                }
            },
            // 单个
            // 'hi,' + this.msg
            // 多个
            [
                h('p', { class: 'red' }, 'hi'),
                h('p', { class: 'blue' }, 'mini-vue'),
                h(Foo, {
                    count: 1
                })
            ]
        )
    },

    setup() {
        return {
            msg: 'mini-vue'
        }
    }
}
