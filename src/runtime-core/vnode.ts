/**
 * 创建虚拟节点函数
 * @param type 组件本身
 * @param props 组件属性
 * @param children 子组件
 * @returns 虚拟节点
 */
export function createVnode(type: any, props?: any, children?: any) {
    const vnode = {
        type,
        props,
        children,
        el: null
    }

    return vnode
}
