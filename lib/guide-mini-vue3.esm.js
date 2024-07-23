// 对象属性合并
const extend = Object.assign;
// 判断是对象
const isObject = (val) => val !== null && typeof val === 'object';
// 是否包含属性
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);

// 收集依赖的 weakMap 对象
const targetMap = new WeakMap();
/**
 * 触发依赖，由proxy对象setter触发
 * 从 targetMap 中取出收集的依赖（effect 函数），进行执行
 * @param target proxy 对象
 * @param key proxy 对象 key
 */
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
/**
 * 触发dep中的依赖
 * @param dep 依赖
 */
function triggerEffects(dep) {
    for (const effect of dep) {
        // 如果effect 有设置 sceduler,则执行scheduler，否则执行effect
        if (effect.scheduler) {
            effect.scheduler();
        }
        else {
            effect.run();
        }
    }
}

// reactive getter 和 setter
const get = createGetter();
const set = createSetter();
// readonly getter
const readonlyGet = createGetter(true);
// shallowReadonly getter
const shallowReadonlyGet = createGetter(true, true);
/**
 * 生成 getter 函数
 * @param isReadonly boolean 是否仅读的
 * @param isShallow boolean 是否仅浅层是响应式的
 * @returns  {Function}
 */
function createGetter(isReadonly = false, isShallow = false) {
    return function get(target, key) {
        // 如果获取的key 是 is_reactive，则用于判断是否是响应式对象
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        // 如果是浅层代理，则直接返回 res
        if (isShallow) {
            return res;
        }
        // 如果 res 是对象，再次递归处理
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        return res;
    };
}
/**
 * 生成 setter 函数
 * @returns
 */
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发更新
        trigger(target, key);
        return res;
    };
}
//  reactive proxy handler
const mutableHandlers = {
    get,
    set
};
// reaonly proxy handler
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set failed because target is readonly`, target);
        return true;
    }
};
// shallowReadonlyHandlers proxy handler
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(raw) {
    return createReactiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandlers);
}
function createReactiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el // $el 的处理方法
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // 优选从已注册的数据中返回
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
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
        setupState: {}, // 组件代理对象
        props: {}
    };
    return component;
}
/**
 * 设置组件
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // TODO
    initProps(instance, instance.vnode.props);
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
        // 使用shallowReadonly，使得 props 不可更改
        const setupResult = setup(shallowReadonly(instance.props));
        handleSetupResult(instance, setupResult);
    }
}
/**
 * 处理setup结果
 * @param instance 组件实例
 * @param setupResult setup 函数执行的结果
 */
function handleSetupResult(instance, setupResult) {
    // TODO function
    if (typeof setupResult === 'object') {
        // 赋值 setup 函数执行的结果
        instance.setupState = setupResult;
    }
    // 完成组件注册
    finishComponentSetup(instance);
}
/**
 * 完成组件注册
 * @param instance 组件实例
 */
function finishComponentSetup(instance) {
    const Component = instance.type;
    // if (Component.render) {
    // 赋值组件的render 函数
    instance.render = Component.render;
    // }
}

/**
 * render 渲染函数
 * @param vnode 虚拟节点
 * @param container 容器
 */
function render(vnode, container) {
    patch(vnode, container);
}
/**
 * patch 对比节点更新
 * @param vnode 虚拟节点
 * @param container 容器
 */
function patch(vnode, container) {
    // ShapeFlags(标识vnode 类型)
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 如果vnode 是元素类型
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 如果vnode 是组件类型
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
    const { children, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        // 如果是 text_children
        el.textContent = children;
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        // 如果是 array_children
        mountChildren(vnode, el);
    }
    // props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        // 校验该props 是事件
        const isOn = (key) => /^on[A-Z]/.test(key);
        if (isOn(key)) {
            // 获取监听事件名称
            const event = key.slice(2).toLocaleLowerCase();
            // 如果是事件，则添加事件监听
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
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
    const instance = createComponentInstance(initialVnode);
    // 初始化组件状态
    setupComponent(instance);
    // 创建渲染效果
    setupRenderEffect(instance, initialVnode, container);
}
/**
 * 创建渲染效果
 * @param instance 组件实例
 * @param initialVnode 虚拟节点
 * @param container 容器
 */
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
 * @param type 组件本身
 * @param props 组件属性
 * @param children 子组件
 * @returns 虚拟节点
 */
function createVnode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    if (typeof children === 'string') {
        vnode.shapeFlag = vnode.shapeFlag | 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag = vnode.shapeFlag | 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    return vnode;
}
/**
 * 获取类型，如果是 string，则是元素，否则是组件
 * @param type 组件
 * @returns
 */
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

/**
 * 创建视图入口
 * @param rootComponent 根组件，其格式如下
 * {
 *  render () {}, // 渲染函数
 *  setup () {}, // setup 函数
 * }
 * @returns {
 *  mount: function // 挂载函数
 * }
 */
function createApp(rootComponent) {
    return {
        /**
         * 挂载函数
         * @param rootContainer 根容器
         */
        mount(rootContainer) {
            /**
             * 通过 createVnode 生成虚拟节点，其格式如下
             * {
             *  children // 子节点
             *  el // 真实节点
             *  props // 属性
             *  type // 根组件（{render(){}, setup(){}}）
             * }
             */
            const vnode = createVnode(rootComponent);
            // 调用渲染函数
            render(vnode, rootContainer);
        }
    };
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

export { createApp, h };
