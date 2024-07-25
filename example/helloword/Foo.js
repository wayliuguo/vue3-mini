import { h } from '../../lib/guide-mini-vue3.esm.js'
export const Foo = {
    name: 'Foo',
    setup(props, { emit }) {
        console.log(props)
        props.count++ // 测试 props 不可更改

        const emitAdd = () => {
            console.log('emit add')
            emit('add', 1, 2)
            emit('add-foo', 1, 2)
        }
        return {
            emitAdd
        }
    },
    render() {
        const btn = h(
            'button',
            {
                onClick: this.emitAdd
            },
            'emitAdd'
        )
        const foo = h('p', {}, 'foo' + this.count)
        return h('div', {}, [foo, btn])
    }
}
