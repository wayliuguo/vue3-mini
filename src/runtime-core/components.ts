export function createComponentInstance(vnode: any) {
    const component = {
        vnode,
        type: vnode.type
    }

    return component
}

export function setupComponent(instance: any) {
    // TODO
    // initProps()
    // initSlots()

    setupStatefulComponent(instance)
}

function setupStatefulComponent(instance: any) {
    const Component = instance.type

    const { setup } = Component
    if (setup) {
        // setup 可以是 Function 或 Object
        // 如果是 Function，则认为其是组件的render函数
        // 如果是 Object，则注入到组件上下文中
        const setupResult = setup()

        handleSetupResult(setupResult)
    }
}

function handleSetupResult(setupResult: any) {
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    finishComponentSetup(instance)
}

function finishComponentSetup(instance: any) {
    const Component = instance.type
    if (Component.render) {
        instance.render = Component.render
    }
}
