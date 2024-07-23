import { h } from '../../lib/guide-mini-vue3.esm.js'
export const Foo = {
    name: 'Foo',
    setup(props) {
        console.log(props)
        props.count++ // 测试 props 不可更改
    },
    render() {
        return h('div', {}, 'foo:' + this.count)
    }
}
