// 对象属性合并
// 判断是对象
const isObject = (val) => val !== null && typeof val === 'object';

const publicPropertiesMap = {
    $el: (i) => i.vnode.el // $el 的处理方法
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 优选从已注册的数据中返回
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns
 */
function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {} // 组件代理对象
    };
    return component;
}
/**
 * 设置组件
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // TODO
    // initProps()
    // initSlots()
    setupStatefulComponent(instance);
}
/**
 * 设置有状态组件
 * @param instance 组件实例
 */
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // ctx
    // 通过组件代理对象获取数据
    instance.proxy = new Proxy({
        _: instance
    }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        // setup 可以是 Function 或 Object
        // 如果是 Function，则认为其是组件的render函数
        // 如果是 Object，则注入到组件上下文中
        const setupResult = setup();
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理setup结果
 * @param instance
 * @param setupResult
 */
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if (Component.render) {
    instance.render = Component.render;
    // }
}

/**
 * render
 * @param vnode 虚拟节点
 * @param container 容器
 */
function render(vnode, container) {
    patch(vnode, container);
}
/**
 * patch
 * @param vnode 虚拟节点
 * @param container 容器
 */
function patch(vnode, container) {
    if (typeof vnode.type === 'string') {
        // 如果vnode.type 是字符串类型,则是 element
        processElement(vnode, container);
    }
    else if (isObject(vnode.type)) {
        // 如果vnode.type 是对象类型,则是组件
        processComponent(vnode, container);
    }
}
/**
 * 创建元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processElement(vnode, container) {
    mountElement(vnode, container);
}
/**
 * 挂载元素
 * @param vnode 虚拟节点
 * @param container 容器
 */
function mountElement(vnode, container) {
    // 创建元素（赋值到vnode上）
    const el = (vnode.el = document.createElement(vnode.type));
    // children
    const { children } = vnode;
    if (typeof children === 'string') {
        // 如果 children 是字符串,则直接赋值为元素内容
        el.textContent = children;
    }
    else if (Array.isArray(children)) {
        // 如果是数组,则遍历挂载到元素上
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        el.setAttribute(key, val);
    }
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
/**
 * processComponent
 * @param vnode 虚拟节点
 * @param container 容器
 */
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
/**
 * 挂载组件
 * @param initialVnode 虚拟节点
 * @param container 容器
 */
function mountComponent(initialVnode, container) {
    const instance = createComponentInstance(initialVnode);
    setupComponent(instance);
    setupRenderEffect(instance, initialVnode, container);
}
function setupRenderEffect(instance, initialVnode, container) {
    const { proxy } = instance;
    // 使render 函数的执行时指向 proxy对象，以获取正确数据
    const subTree = instance.render.call(proxy);
    patch(subTree, container);
    // 把根阶段元素赋值组件元素
    initialVnode.el = subTree.el;
}

/**
 * 创建虚拟节点函数
 * @param type
 * @param props
 * @param children
 * @returns 虚拟节点
 */
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null
    };
    return vnode;
}

/**
 * 创建视图入口
 * @param rootComponent 根组件
 * @returns {
 *  mount: function // 挂载函数
 * }
 */
function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // components --> vnode(把组件转换为虚拟节点)
            const vnode = createVnode(rootComponent);
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
