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
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options

    /**
     * render 渲染函数
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function render(vnode: any, container: any) {
        patch(null, vnode, container, null, null)
    }

    /**
     * patch 对比节点更新
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     */
    function patch(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any,
        anchor: any
    ) {
        // ShapeFlags(标识n2 类型)
        const { type, shapeFlag } = n2

        // Fragment => 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor)
                break
            case Text:
                processText(n1, n2, container)
                break
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    // 如果n2 是元素类型
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 如果n2 是组件类型
                    processComponent(n1, n2, container, parentComponent, anchor)
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
        parentComponent: any,
        anchor: any
    ) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor)
        } else {
            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function patchElement(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any,
        anchor: any
    ) {
        const oldProps = n1.props || {}
        const newProps = n2.props || {}

        const el = (n2.el = n1.el)

        patchChildren(n1, n2, el, parentComponent, anchor)

        patchProps(el, oldProps, newProps)
    }

    function patchChildren(
        n1: any,
        n2: any,
        container: any,
        parentComponent: any,
        anchor: any
    ) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1
        const { shapeFlag, children: c2 } = n2

        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 如果新的是 text
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
                // 如果旧的是 array
                // 把老的 children 清空
                unmountChildren(n1.children)
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2)
            }
        } else {
            // 如果新的是一个数组
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '')
                mountChildren(c2, container, parentComponent, anchor)
            } else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
            }
        }
    }

    function patchKeyedChildren(
        c1: any,
        c2: any,
        container: any,
        parentComponent: any,
        parentAnchor: any
    ) {
        const l2 = c2.length
        let i = 0
        let e1 = c1.length - 1
        let e2 = l2 - 1

        function isSomeVnodeType(n1: any, n2: any) {
            // type
            // key
            return n1.type === n2.type && n1.key === n2.key
        }

        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i]
            const n2 = c2[i]

            if (isSomeVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            i++
        }

        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1]
            const n2 = c2[e2]

            if (isSomeVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor)
            } else {
                break
            }
            e1--
            e2--
        }

        // 新的比老的多-创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1
                const anchor = e2 + 1 < l2 ? c2[nextPos].el : null
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++
                }
            }
        } else if (i > e2) {
            // 老的比新的过-移除
            while (i <= e1) {
                hostRemove(c1[i].el)
                i++
            }
        } else {
            // 乱序对比
        }
    }

    function unmountChildren(children: any) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el
            // remove
            hostRemove(el)
        }
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
        parentComponent: any,
        anchor: any
    ) {
        mountChildren(n2.children, container, parentComponent, anchor)
    }

    /**
     * 挂载元素
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function mountElement(
        vnode: any,
        container: any,
        parentComponent: any,
        anchor: any
    ) {
        // 创建元素（赋值到vnode上）
        const el = (vnode.el = hostCreateElement(vnode.type))

        // children
        const { children, shapeFlag } = vnode
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            // 如果是 text_children
            el.textContent = children
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 如果是 array_children
            mountChildren(vnode.children, el, parentComponent, anchor)
        }
        // props
        const { props } = vnode
        for (const key in props) {
            const val = props[key]
            hostPathPro(el, key, null, val)
        }

        hostInsert(el, container, anchor)
    }

    function mountChildren(
        children: any,
        container: any,
        parentComponent: any,
        anchor: any
    ) {
        children.forEach((v: any) => {
            patch(null, v, container, parentComponent, anchor)
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
        parentComponent: any,
        anchor: any
    ) {
        mountComponent(n2, container, parentComponent, anchor)
    }

    /**
     * 挂载组件
     * @param initialVnode 虚拟节点
     * @param container 容器
     */
    function mountComponent(
        initialVnode: any,
        container: any,
        parentComponent: any,
        anchor: any
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
        setupRenderEffect(instance, initialVnode, container, anchor)
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
        container: any,
        anchor: any
    ) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance
                // 使render 函数的执行时指向 proxy对象，以获取正确数据
                // instance.subTree：记录当前的 subTree
                const subTree = (instance.subTree = instance.render.call(proxy))
                patch(null, subTree, container, instance, anchor)

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

                patch(prevSubTree, subTree, container, instance, anchor)
            }
        })
    }

    return {
        createApp: createAppAPI(render)
    }
}
