const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
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
    // 组件 + children object
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag = vnode.shapeFlag | 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVnode(text) {
    return createVnode(Text, {}, text);
}
/**
 * 获取类型，如果是 string，则是元素，否则是组件
 * @param type 组件
 * @returns
 */
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVnode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVnode(Fragment, {}, slot(props));
        }
    }
}

// 对象属性合并
const extend = Object.assign;
// 判断是对象
const isObject = (val) => val !== null && typeof val === 'object';
// 是否变更
const hanChanged = (val, newValue) => !Object.is(val, newValue);
const isEmpty = (value) => {
    if (value === null || value === undefined) {
        return true;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    if (typeof value === 'object') {
        return Object.keys(value).length === 0;
    }
    if (typeof value === 'string') {
        return value.length === 0;
    }
    return false;
};
// 是否包含属性
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// 横线变为驼峰，add-foo => addFoo
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// 字符串第一个变大写（add => Add）
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
// 添加前缀 on add => onAdd
const toHandleKey = (str) => {
    return str ? 'on' + capitalize(str) : '';
};

// 收集依赖的 weakMap 对象
const targetMap = new WeakMap();
// 当前的 effect
let activeEffect;
let shouldTrack;
/**
 * 判断是否正在收集依赖
 * @returns boolean
 */
function isTracking() {
    return shouldTrack && activeEffect;
}
/**
 * 收集依赖,由proxy对象getter触发，构建的数据如下：
 * weakMap{target: Map}
 * Map{key: Set}
 * Set{key: effect1, key: effect2}
 * @param target proxy 对象
 * @param key proxy 对象 key
 */
function track(target, key) {
    if (!isTracking())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
/**
 * 传入 dep，收集依赖
 * @param dep 依赖 Map
 * @returns {undefined}
 */
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    // activeEffect 的 deps 收集 dep
    activeEffect.deps.push(dep);
}
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
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 融合所有属性
    extend(_effect, options);
    _effect.run();
    // 优化前： _effect.run.bind(_effect) 以当前ReactiveEffect实例作为this指向，并返回该effect可执行函数
    // 优化后：定义处使用了箭头函数，无需指定绑定
    const runner = _effect.run;
    runner.effect = _effect;
    return runner;
}
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = []; //
        this.active = true;
        // 使用箭头函数优化，其指向会绑定在ReactiveEffect实例上
        this.run = () => {
            if (!this.active) {
                // 如果调用stop 清空依赖了
                return this._fn();
            }
            // 如果未调用stop清空依赖，则设置activeEffect未当前实例，且全局标识shouldTrack(应收集依赖)置为true
            shouldTrack = true;
            activeEffect = this;
            const result = this._fn();
            // 重置shouldTrack(应收集依赖)为false
            shouldTrack = false;
            return result;
        };
        /* run() {
            activeEffect = this
            return this._fn()
        } */
        this.stop = () => {
            if (this.active) {
                cleanUpEffect(this);
                this.active = false;
                if (this.onStop) {
                    this.onStop();
                }
            }
        };
        this._fn = fn;
        this.scheduler = scheduler;
    }
}
// 清空 effect
function cleanUpEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
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
        if (!isReadonly) {
            // 收集依赖
            track(target, key);
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

var _a;
class RefImpl {
    constructor(value) {
        this[_a] = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    // ref value getter
    get value() {
        trackRefValue(this);
        return this._value;
    }
    // ref value setter
    set value(newValue) {
        // 对比当前设置的值与原数据是否有变化
        if (hanChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
_a = "__v_isRef" /* ReactiveFlags.IS_REF */;
function ref(value) {
    return new RefImpl(value);
}
/**
 * 判断是否Ref
 * @param ref RefImpl 实例
 * @returns {boolean}
 */
function isRef(ref) {
    return !!ref["__v_isRef" /* ReactiveFlags.IS_REF */];
}
// 如果参数是ref，则返回内部值，否则返回参数本身
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            // 通过unRef 省略.value
            return unRef(Reflect.get(target, key));
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                // 如果原来属性是ref，设为非 ref
                // 直接改变其value属性值
                return target[key].value = value;
            }
            else {
                return Reflect.set(target, key, value);
            }
        }
    });
}
/**
 * 收集Ref依赖
 * @param ref RefImpl 实例
 */
function trackRefValue(ref) {
    if (isTracking()) {
        trackEffects(ref.dep);
    }
}
/**
 * 转换value（）
 * @param value any
 * @returns {any}
 */
function convert(value) {
    // 如果 value 是对象，则使用 reactive 处理
    return isObject(value) ? reactive(value) : value;
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // 处理触发函数名称
    const handlerName = toHandleKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el, // $el 的处理方法
    $slots: (i) => i.slots // $slots 的处理方法
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

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slot
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}

let currentInstance = null;
/**
 * 创建组件实例
 * @param vnode 虚拟节点
 * @returns
 */
function createComponentInstance(vnode, parent) {
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
        emit: () => { }
    };
    // 组件emit 函数，通过bind 函数指定函数的第二个参数
    component.emit = emit.bind(null, component);
    return component;
}
/**
 * 设置组件
 * @param instance 组件实例
 */
function setupComponent(instance) {
    // 初始化 props
    initProps(instance, instance.vnode.props);
    // 初始化 slots
    initSlots(instance, instance.vnode.children);
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
        // 赋值全局变量：当前组件实例对象
        setCurrentInstance(instance);
        // setup 可以是 Function 或 Object
        // 如果是 Function，则认为其是组件的render函数
        // 如果是 Object，则注入到组件上下文中
        // 使用shallowReadonly，使得 props 不可更改
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        // 重置全局变量：当前组件实例对象
        setCurrentInstance(null);
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
        instance.setupState = proxyRefs(setupResult);
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
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 获取组件实例对象
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 由于初始化的时候（createComponentInstance处）指定了当前的provides 等于了父组件的 provides
        // 所以这个时候，如果相等，则认为是初始化
        if (provides === parentProvides) {
            // 更改子组件的provides原型指向父组件原型
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 获取组件实例对象
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            // 如果存在，则返回 provide 的值
            return parentProvides[key];
        }
        else if (defaultValue) {
            // 如果不存在，则返回默认值
            if (typeof defaultValue === 'function') {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

function createAppAPI(render) {
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
    return function createApp(rootComponent) {
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
    };
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchPro: hostPathPro, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    /**
     * render 渲染函数
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function render(vnode, container) {
        patch(null, vnode, container, null);
    }
    /**
     * patch 对比节点更新
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     */
    function patch(n1, n2, container, parentComponent) {
        // ShapeFlags(标识n2 类型)
        const { type, shapeFlag } = n2;
        // Fragment => 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 如果n2 是元素类型
                    processElement(n1, n2, container, parentComponent);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 如果n2 是组件类型
                    processComponent(n1, n2, container, parentComponent);
                }
                break;
        }
    }
    /**
     * 创建元素
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     * @param container 容器
     */
    function processElement(n1, n2, container, parentComponent) {
        if (!n1) {
            mountElement(n2, container, parentComponent);
        }
        else {
            patchElement(n1, n2, container, parentComponent);
        }
    }
    function patchElement(n1, n2, container, parentComponent) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent) {
        const { shapeFlag: prevShapeFlag, children: c1 } = n1;
        const { shapeFlag, children: c2 } = n2;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 如果新的是 text
            if (prevShapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 如果旧的是 array
                // 把老的 children 清空
                unmountChildren(n1.children);
            }
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 如果新的是一个数组
            if (prevShapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent);
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // 遍历新虚拟节点
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPathPro(el, key, prevProp, nextProp);
                }
            }
            if (!isEmpty(oldProps)) {
                // 遍历旧虚拟节点
                for (const key in oldProps) {
                    // 如果新的虚拟节点中已经删除了该key
                    if (!(key in newProps)) {
                        const prevProp = oldProps[key];
                        hostPathPro(el, key, prevProp, null);
                    }
                }
            }
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    function processFragment(n1, n2, container, parentComponent) {
        mountChildren(n2.children, container, parentComponent);
    }
    /**
     * 挂载元素
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function mountElement(vnode, container, parentComponent) {
        // 创建元素（赋值到vnode上）
        const el = (vnode.el = hostCreateElement(vnode.type));
        // children
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            // 如果是 text_children
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 如果是 array_children
            mountChildren(vnode.children, el, parentComponent);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPathPro(el, key, null, val);
        }
        hostInsert(el, container);
    }
    function mountChildren(children, container, parentComponent) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent);
        });
    }
    /**
     * processComponent
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     * @param container 容器
     */
    function processComponent(n1, n2, container, parentComponent) {
        mountComponent(n2, container, parentComponent);
    }
    /**
     * 挂载组件
     * @param initialVnode 虚拟节点
     * @param container 容器
     */
    function mountComponent(initialVnode, container, parentComponent) {
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
        const instance = createComponentInstance(initialVnode, parentComponent);
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
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 使render 函数的执行时指向 proxy对象，以获取正确数据
                // instance.subTree：记录当前的 subTree
                const subTree = (instance.subTree = instance.render.call(proxy));
                patch(null, subTree, container, instance);
                // 把根阶段元素赋值组件元素
                initialVnode.el = subTree.el;
                // 标识已经挂载了
                instance.isMounted = true;
            }
            else {
                const { proxy } = instance;
                // 当前最新subTree
                const subTree = instance.render.call(proxy);
                // 旧 subTree
                const prevSubTree = instance.subTree;
                // 更新 instance.subTree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchPro(el, key, preVal, nextVal) {
    // 校验该props 是事件
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 获取监听事件名称
        const event = key.slice(2).toLocaleLowerCase();
        // 如果是事件，则添加事件监听
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(el, parent) {
    parent.append(el);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchPro,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

export { createApp, createRenderer, createTextVnode, getCurrentInstance, h, inject, provide, proxyRefs, ref, renderSlots };
