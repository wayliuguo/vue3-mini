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
// const prevChildren = [h('p', { key: 'A' }, 'A'), h('p', { key: 'B' }, 'B')]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D')
// ]
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

// 5. 对比中间的部分
// 删除老的（在老的里面存在，新的里面不存在）
// 5.1
// a,b,(c,d),f,g
// a,b,(e,c),f,g
// d 节点在新的里面是没有的 - 需要删除
// c 节点在 props 也发生了变化
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C', id: 'c-prev' }, 'C'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'C', id: 'c-prev' }, 'C'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]

// 5.1.1
// a,b,(c,e,d),f,g
// a,b,(e,c),f,g
// 中间部分，老的比新的多，那么多出来的直接就可以删除了（5.1的优化逻辑）
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C', id: 'c-prev' }, 'C'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'C', id: 'c-prev' }, 'C'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]

// 5.2 移动（节点存在于新的和老的里面，但是位置变了）
// a,b,(c,d,e),f,g
// a,b,(e,c,d),f,g
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]


// 5.3 创建新的节点
// a,b,(c,e),f,g
// a,b,(e,c,d),f,g
// const prevChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]
// const nextChildren = [
//     h('p', { key: 'A' }, 'A'),
//     h('p', { key: 'B' }, 'B'),
//     h('p', { key: 'E' }, 'E'),
//     h('p', { key: 'C' }, 'C'),
//     h('p', { key: 'D' }, 'D'),
//     h('p', { key: 'F' }, 'F'),
//     h('p', { key: 'G' }, 'G')
// ]

// 6 综合例子
// a,b,(c,d,e,z),f,g
// a,b,(d,c,y,e),f,g
const prevChildren = [
    h('p', { key: 'A' }, 'A'),
    h('p', { key: 'B' }, 'B'),
    h('p', { key: 'C' }, 'C'),
    h('p', { key: 'D' }, 'D'),
    h('p', { key: 'E' }, 'E'),
    h('p', { key: 'Z' }, 'Z'),
    h('p', { key: 'F' }, 'F'),
    h('p', { key: 'G' }, 'G')
]
const nextChildren = [
    h('p', { key: 'A' }, 'A'),
    h('p', { key: 'B' }, 'B'),
    h('p', { key: 'D' }, 'D'),
    h('p', { key: 'C' }, 'C'),
    h('p', { key: 'Y' }, 'Y'),
    h('p', { key: 'E' }, 'E'),
    h('p', { key: 'F' }, 'F'),
    h('p', { key: 'G' }, 'G')
]


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
