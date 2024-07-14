import { PublicInstanceProxyHandlers } from './componentPublicInstance'

/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns
 */
export function createComponentInstance(vnode: any) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {} // 组件代理对象
    }

    return component
}

/**
 * 设置组件
 * @param instance 组件实例
 */
export function setupComponent(instance: any) {
    // TODO
    // initProps()
    // initSlots()

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
        // setup 可以是 Function 或 Object
        // 如果是 Function，则认为其是组件的render函数
        // 如果是 Object，则注入到组件上下文中
        const setupResult = setup()

        handleSetupResult(instance, setupResult)
    }
}

/**
 * 处理setup结果
 * @param instance
 * @param setupResult
 */
function handleSetupResult(instance: any, setupResult: any) {
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    // if (Component.render) {
    instance.render = Component.render
    // }
}
