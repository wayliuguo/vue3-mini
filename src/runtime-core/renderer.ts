import { ShapeFlags } from '../shared/ShapeFlags'
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
    // ShapeFlags(标识vnode 类型)
    const { shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.ELEMENT) {
        // 如果vnode 是元素类型
        processElement(vnode, container)
    } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        // 如果vnode 是组件类型
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
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 如果是 text_children
        el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果是 array_children
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
