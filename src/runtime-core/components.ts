import { shallowReadonly } from '../reactivity/reactive'
import { proxyRefs } from '../reactivity/ref'
import { emit } from './componentEmit'
import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { initSlots } from './componentSlots'

let currentInstance: any = null

/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns
 */
export function createComponentInstance(vnode: any, parent: any) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {}, // 组件代理对象
        props: {},
        slots: {},
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        emit: () => {}
    }

    // 组件emit 函数，通过bind 函数指定函数的第二个参数
    component.emit = emit.bind(null, component) as any

    return component
}

/**
 * 设置组件
 * @param instance 组件实例
 */
export function setupComponent(instance: any) {
    // 初始化 props
    initProps(instance, instance.vnode.props)
    // 初始化 slots
    initSlots(instance, instance.vnode.children)

    setupStatefulComponent(instance)
}

/**
 * 设置有状态组件
 * @param instance 组件实例
 */
function setupStatefulComponent(instance: any) {
    const Component = instance.type

    // ctx
    // 通过组件代理对象获取数据
    instance.proxy = new Proxy(
        {
            _: instance
        },
        PublicInstanceProxyHandlers
    )

    const { setup } = Component
    if (setup) {
        // 赋值全局变量：当前组件实例对象
        setCurrentInstance(instance)

        // setup 可以是 Function 或 Object
        // 如果是 Function，则认为其是组件的render函数
        // 如果是 Object，则注入到组件上下文中
        // 使用shallowReadonly，使得 props 不可更改
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        })

        // 重置全局变量：当前组件实例对象
        setCurrentInstance(null)

        handleSetupResult(instance, setupResult)
    }
}

/**
 * 处理setup结果
 * @param instance 组件实例
 * @param setupResult setup 函数执行的结果
 */
function handleSetupResult(instance: any, setupResult: any) {
    // TODO function
    if (typeof setupResult === 'object') {
        // 赋值 setup 函数执行的结果
        instance.setupState = proxyRefs(setupResult)
    }

    // 完成组件注册
    finishComponentSetup(instance)
}

/**
 * 完成组件注册
 * @param instance 组件实例
 */
function finishComponentSetup(instance: any) {
    const Component = instance.type
    // if (Component.render) {
    // 赋值组件的render 函数
    instance.render = Component.render
    // }
}

export function getCurrentInstance() {
    return currentInstance
}

function setCurrentInstance(instance: any) {
    currentInstance = instance
}