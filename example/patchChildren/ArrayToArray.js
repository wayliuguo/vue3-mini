// 老的是 array
// 新的是 array
import { ref, h } from '../../lib/guide-mini-vue3.esm.js'

// 1. 左侧的对比
// (a b) c
// (a b) d e
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C')
// ]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'E' }, 'E')
// ]

// 2. 右侧的对比
// a (b c)
// d e (b c)
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C')
// ]
// const nextChildren = [
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C')
// ]

// 3. 新的比老的长
// 创建新的
// 左侧
// (a b)
// (a b) c d
// i = 2, e1 =1, e2 = 3
const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
const nextChildren = [
    h('p', { key: 'A' }, 'A'),
    h('p', { key: 'B' }, 'B'),
    h('p', { key: 'C' }, 'C'),
    h('p', { key: 'D' }, 'D')
]
// 右侧
// (a b)
// d c (a b)
// i = 0, e1 =-1, e2 = 1
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
// const nextChildren = [
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B')
// ]

// 4. 老的比新的长
// 删除老的
// 左侧
// (a b) c d
// (a b)
// i = 2, e1 = 2, e2 = 1
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D')
// ]
// const nextChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
// 右侧
// c d (a b)
// (a b)
// const prevChildren = [
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B')
// ]
// const nextChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]

export default {
    name: 'ArrayToArray',

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
