import { ShapeFlags } from '../shared/ShapeFlags'

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
        shapeFlag: getShapeFlag(type),
        el: null
    }

    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
    }

    return vnode
}

/**
 * 获取类型，如果是 string，则是元素，否则是组件
 * @param type 组件
 * @returns
 */
function getShapeFlag(type: any) {
    return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
