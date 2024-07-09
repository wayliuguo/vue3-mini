/**
 * 创建虚拟节点函数
 * @param type
 * @param props
 * @param children
 * @returns 虚拟节点
 */
export function createVnode(type: any, props?: any, children?: any) {
    const vnode = {
        type,
        props,
        children
    }

    return vnode
}
