import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './components'
import { Fragment, Text } from './vnode'

/**
 * render 渲染函数
 * @param vnode 虚拟节点
 * @param container 容器
 */
export function render(vnode: any, container: any) {
    patch(vnode, container, null)
}

/**
 * patch 对比节点更新
 * @param vnode 虚拟节点
 * @param container 容器
 */
function patch(vnode: any, container: any, parentComponent: any) {
    // ShapeFlags(标识vnode 类型)
    const { type, shapeFlag } = vnode

    // Fragment => 只渲染 children
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent)
            break
        case Text:
            processText(vnode, container)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                // 如果vnode 是元素类型
                processElement(vnode, container, parentComponent)
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                // 如果vnode 是组件类型
                processComponent(vnode, container, parentComponent)
            }
            break
    }
}

/**
 * 创建元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processElement(vnode: any, container: any, parentComponent: any) {
    mountElement(vnode, container, parentComponent)
}

function processText(vnode: any, container: any) {
    const { children } = vnode
    const textNode = (vnode.el = document.createTextNode(children))
    container.append(textNode)
}

function processFragment(vnode: any, container: any, parentComponent: any) {
    mountChildren(vnode, container, parentComponent)
}

/**
 * 挂载元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function mountElement(vnode: any, container: any, parentComponent: any) {
    // 创建元素（赋值到vnode上）
    const el = (vnode.el = document.createElement(vnode.type))

    // children
    const { children, shapeFlag } = vnode
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        // 如果是 text_children
        el.textContent = children
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果是 array_children
        mountChildren(vnode, el, parentComponent)
    }
    // props
    const { props } = vnode
    for (const key in props) {
        const val = props[key]
        // 校验该props 是事件
        const isOn = (key: any) => /^on[A-Z]/.test(key)
        if (isOn(key)) {
            // 获取监听事件名称
            const event = key.slice(2).toLocaleLowerCase()
            // 如果是事件，则添加事件监听
            el.addEventListener(event, val)
        } else {
            el.setAttribute(key, val)
        }
    }

    container.append(el)
}

function mountChildren(vnode: any, container: any, parentComponent: any) {
    vnode.children.forEach((v: any) => {
        patch(v, container, parentComponent)
    })
}

/**
 * processComponent
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processComponent(vnode: any, container: any, parentComponent: any) {
    mountComponent(vnode, container, parentComponent)
}

/**
 * 挂载组件
 * @param initialVnode 虚拟节点
 * @param container 容器
 */
function mountComponent(
    initialVnode: any,
    container: any,
    parentComponent: any
) {
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
    const instance = createComponentInstance(initialVnode, parentComponent)
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
    patch(subTree, container, instance)

    // 把根阶段元素赋值组件元素
    initialVnode.el = subTree.el
}
