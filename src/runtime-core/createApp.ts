import { render } from './renderer'
import { createVnode } from './vnode'
/**
 * 创建视图入口
 * @param rootComponent 根组件，其格式如下
 * {
 *  render () {}, // 渲染函数
 *  setup () {}, // setup 函数
 * }
 * @returns {
 *  mount: function // 挂载函数
 * }
 */
export function createApp(rootComponent: any) {
    return {
        /**
         * 挂载函数
         * @param rootContainer 根容器
         */
        mount(rootContainer: any) {
            /**
             * 通过 createVnode 生成虚拟节点，其格式如下
             * {
             *  children // 子节点
             *  el // 真实节点
             *  props // 属性
             *  type // 根组件（{render(){}, setup(){}}）
             * }
             */
            const vnode = createVnode(rootComponent)
            // 调用渲染函数
            render(vnode, rootContainer)
        }
    }
}
