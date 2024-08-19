import { h, getCurrentInstance } from '../../lib/guide-mini-vue3.esm.js'
import { Foo } from './Foo.js'
export const App = {
    name: 'APP',
    render() {
        return h('div', {}, [h('p', {}, 'currentInstance demo'), h(Foo)])
    },

    setup() {
        const instance = getCurrentInstance()
        console.log('App：', instance)
        return {}
    }
}
