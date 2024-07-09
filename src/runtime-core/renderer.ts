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
    // 去处理组件
    processComponent(vnode, container)
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
