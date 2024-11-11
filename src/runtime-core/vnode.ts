import { ShapeFlags } from '../shared/ShapeFlags'

export const Fragment = Symbol('Fragment')
export const Text = Symbol('Text')
export { createVNode as createElementVNode }

/**
 * 创建虚拟节点函数
 * @param type 组件本身
 * @param props 组件属性
 * @param children 子组件
 * @returns 虚拟节点
 */
export function createVNode(type: any, props?: any, children?: any) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        next: null, // 下次要更新的虚拟节点
        key: props?.key,
        shapeFlag: getShapeFlag(type),
        el: null
    }

    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.TEXT_CHILDREN
    } else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.ARRAY_CHILDREN
    }

    // 组件 + children object
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === 'object') {
            vnode.shapeFlag = vnode.shapeFlag | ShapeFlags.SLOT_CHILDREN
        }
    }

    return vnode
}

export function createTextVnode(text: string) {
    return createVNode(Text, {}, text)
}

/**
 * 获取类型，如果是 string，则是元素，否则是组件
 * @param type 组件
 * @returns
 */
function getShapeFlag(type: any) {
    return typeof type === 'string' ? ShapeFlags.ELEMENT : ShapeFlags.STATEFUL_COMPONENT
}
