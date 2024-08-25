import { effect } from '../reactivity/effect'
import { isEmpty } from '../shared/index'
import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './components'
import { createAppAPI } from './createApp'
import { Fragment, Text } from './vnode'

export function createRenderer(options: any) {
    const {
        createElement: hostCreateElement,
        patchPro: hostPathPro,
        insert: hostInsert
    } = options

    /**
     * render 渲染函数
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function render(vnode: any, container: any) {
        patch(null, vnode, container, null)
    }

    /**
     * patch 对比节点更新
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     */
    function patch(n1: any, n2: any, container: any, parentComponent: any) {
        // ShapeFlags(标识n2 类型)
        const { type, shapeFlag } = n2

        // Fragment => 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent)
                break
            case Text:
                processText(n1, n2, container)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 如果n2 是元素类型
                    processElement(n1, n2, container, parentComponent)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 如果n2 是组件类型
                    processComponent(n1, n2, container, parentComponent)
                }
                break
        }
    }

    /**
     * 创建元素
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     * @param container 容器
     */
    function processElement(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any
    ) {
        if (!n1) {
            mountElement(n2, container, parentComponent)
        } else {
            patchElement(n1, n2, container)
        }
    }

    function patchElement(n1: any, n2: any, container: any) {
        console.log('n1', n1)
        console.log('n2', n2)
        const oldProps = n1.props || {}
        const newProps = n2.props || {}

        const el = (n2.el = n1.el)

        patchProps(el, oldProps, newProps)
    }

    function patchProps(el: any, oldProps: any, newProps: any) {
        if (oldProps !== newProps) {
            // 遍历新虚拟节点
            for (const key in newProps) {
                const prevProp = oldProps[key]
                const nextProp = newProps[key]

                if (prevProp !== nextProp) {
                    hostPathPro(el, key, prevProp, nextProp)
                }
            }

            if (!isEmpty(oldProps)) {
                // 遍历旧虚拟节点
                for (const key in oldProps) {
                    // 如果新的虚拟节点中已经删除了该key
                    if (!(key in newProps)) {
                        const prevProp = oldProps[key]
                        hostPathPro(el, key, prevProp, null)
                    }
                }
            }
        }
    }

    function processText(n1: any, n2: any, container: any) {
        const { children } = n2
        const textNode = (n2.el = document.createTextNode(children))
        container.append(textNode)
    }

    function processFragment(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any
    ) {
        mountChildren(n2, container, parentComponent)
    }

    /**
     * 挂载元素
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function mountElement(vnode: any, container: any, parentComponent: any) {
        // 创建元素（赋值到vnode上）
        const el = (vnode.el = hostCreateElement(vnode.type))

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
            hostPathPro(el, key, null, val)
        }

        hostInsert(el, container)
    }

    function mountChildren(vnode: any, container: any, parentComponent: any) {
        vnode.children.forEach((v: any) => {
            patch(null, v, container, parentComponent)
        })
    }

    /**
     * processComponent
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     * @param container 容器
     */
    function processComponent(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any
    ) {
        mountComponent(n2, container, parentComponent)
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
    function setupRenderEffect(
        instance: any,
        initialVnode: any,
        container: any
    ) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance
                // 使render 函数的执行时指向 proxy对象，以获取正确数据
                // instance.subTree：记录当前的 subTree
                const subTree = (instance.subTree = instance.render.call(proxy))
                patch(null, subTree, container, instance)

                // 把根阶段元素赋值组件元素
                initialVnode.el = subTree.el

                // 标识已经挂载了
                instance.isMounted = true
            } else {
                const { proxy } = instance
                // 当前最新subTree
                const subTree = instance.render.call(proxy)
                // 旧 subTree
                const prevSubTree = instance.subTree

                // 更新 instance.subTree
                instance.subTree = subTree

                patch(prevSubTree, subTree, container, instance)
            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}
