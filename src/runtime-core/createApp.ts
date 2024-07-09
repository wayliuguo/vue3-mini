import { render } from './renderer'
import { createVnode } from './vnode'
/**
 * 创建视图入口
 * @param rootComponent 根组件
 * @returns {
 *  mount: function // 挂载函数
 * }
 */
export function createApp(rootComponent: any) {
    return {
        mount(rootContainer: any) {
            // components --> vnode(把组件转换为虚拟节点)
            const vnode = createVnode(rootComponent)

            render(vnode, rootComponent)
        }
    }
}
