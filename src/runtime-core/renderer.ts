import { isObject } from '../shared/index'
import { createComponentInstance, setupComponent } from './components'

/**
 * render
 * @param vnode 虚拟节点
 * @param container 容器
 */
export function render(vnode: any, container: any) {
    patch(vnode, container)
}

/**
 * patch
 * @param vnode 虚拟节点
 * @param container 容器
 */
function patch(vnode: any, container: any) {
    if (typeof vnode.type === 'string') {
        // 如果vnode.type 是字符串类型,则是 element
        processElement(vnode, container)
    } else if (isObject(vnode.type)) {
        // 如果vnode.type 是对象类型,则是组件
        processComponent(vnode, container)
    }
}

/**
 * 创建元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processElement(vnode: any, container: any) {
    mountElement(vnode, container)
}

/**
 * 挂载元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function mountElement(vnode: any, container: any) {
    // 元素
    const el = document.createElement(vnode.type)

    // children
    const { children } = vnode
    if (typeof children === 'string') {
        // 如果 children 是字符串,则直接赋值为元素内容
        el.textContent = children
    } else if (Array.isArray(children)) {
        // 如果是数组,则遍历挂载到元素上
        mountChildren(vnode, el)
    }
    // props
    const { props } = vnode
    for (const key in props) {
        const val = props[key]
        el.setAttribute(key, val)
    }

    container.append(el)
}

function mountChildren(vnode: any, container: any) {
    vnode.children.forEach((v: any) => {
        patch(v, container)
    })
}

/**
 * processComponent
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processComponent(vnode: any, container: any) {
    mountComponent(vnode, container)
}

/**
 * 挂载组件
 * @param vnode 虚拟节点
 * @param container 容器
 */
function mountComponent(vnode: any, container: any) {
    const instance = createComponentInstance(vnode)
    setupComponent(instance)
    setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
    const subTree = instance.render()
    patch(subTree, container)
}
