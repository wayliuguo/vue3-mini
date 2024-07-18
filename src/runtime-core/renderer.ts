import { isObject } from '../shared/index'
import { createComponentInstance, setupComponent } from './components'

/**
 * render 渲染函数
 * @param vnode 虚拟节点
 * @param container 容器
 */
export function render(vnode: any, container: any) {
    patch(vnode, container)
}

/**
 * patch 对比节点更新
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
    // 创建元素（赋值到vnode上）
    const el = (vnode.el = document.createElement(vnode.type))

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
 * @param initialVnode 虚拟节点
 * @param container 容器
 */
function mountComponent(initialVnode: any, container: any) {
    /**
     * 创建组件实例，initialVnode格式如下
     * {
     *  vnode 虚拟节点
        type: vnode.type, 组件本身内容（render(){}, setup(){}）
        setupState: {} // 组件代理对象
     * }
     */
    /**
     * 创建完成的组件实例（instance），其格式如下
     * {
     *  proxy: proxy对象
     *  render: render 函数
     *  setupState: setup 执行的结果对象
     *  type： 组件本身内容（render(){}, setup(){}）
     *  vnode: 虚拟节点
     * }
     */
    const instance = createComponentInstance(initialVnode)
    // 初始化组件状态
    setupComponent(instance)
    // 创建渲染效果
    setupRenderEffect(instance, initialVnode, container)
}

/**
 * 创建渲染效果
 * @param instance 组件实例 
 * @param initialVnode 虚拟节点
 * @param container 容器
 */
function setupRenderEffect(instance: any, initialVnode: any, container: any) {
    const { proxy } = instance
    // 使render 函数的执行时指向 proxy对象，以获取正确数据
    const subTree = instance.render.call(proxy)
    patch(subTree, container)

    // 把根阶段元素赋值组件元素
    initialVnode.el = subTree.el
}
