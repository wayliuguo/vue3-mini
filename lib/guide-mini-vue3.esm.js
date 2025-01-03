function toDisplayString(value) {
    return String(value);
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
const isString = (value) => typeof value === 'string';

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode'
};

function generate(ast) {
    // 创建一个全局变量
    const context = createCodegenContext();
    // 全局变量提供 push 函数
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}){`);
    push('return ');
    genNode(ast.codegenNode, context);
    push('}');
    return {
        code: context.code
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    // 别名处理函数
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length) {
        push(`const { ${ast.helpers
            .map(aliasHelper)
            .join(',')} } = ${VueBinging}`);
    }
    push('\n');
    push('return ');
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 4 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 1 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 2 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 3 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNullable(args) {
    return args.map((arg) => arg || 'null');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(', ');
        }
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

function baseParse(content) {
    const context = createParseContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    // 当未结束解析，继续处理
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        // 如果是插值表达式
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        else if (s[0] === '<') {
            // 如果是元素
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        // 解析 text
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    return !s;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endToken = ['<', '{{'];
    for (let i = 0; i < endToken.length; i++) {
        // 如果匹配到插值表达式，则结束下标需调整
        const index = context.source.indexOf(endToken[i]);
        // 如果匹配多个，取最靠小的下标
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 4 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.START */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.END */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function startsWithEndTagOpen(source, tag) {
    return (source.startsWith('<') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function parseTag(context, type) {
    // 1. 解析 tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    // 2. 删除解析完成的代码
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    // 如果是结束标签，则结束
    if (type === 1 /* TagType.END */)
        return;
    return {
        type: 3 /* NodeTypes.ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    // {{ message }}
    // 开合标签
    const openDeliimiter = '{{';
    // 闭合标签
    const closeDelimiter = '}}';
    // 获取闭合下标
    const closeIndex = context.source.indexOf(closeDelimiter, openDeliimiter.length);
    // 推进-推进开合标签长度（去除开合标签）
    advanceBy(context, openDeliimiter.length);
    // 闭合下标 - 开合标签长度，即为内容长度
    const rawContentLength = closeIndex - openDeliimiter.length;
    // 获取内容（可能携带空字格，需去除）
    const rawConent = parseTextData(context, rawContentLength);
    // 去除空字格
    const content = rawConent.trim();
    // 推进-推进内容长度+闭合标签长度
    advanceBy(context, closeDelimiter.length);
    return {
        type: 1 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 2 /* NodeTypes.SIMPLE_EXPRESSION */,
            content
        }
    };
}
// 推进函数，去除推进长度的开端字符
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 0 /* NodeTypes.ROOT */
    };
}
function createParseContext(content) {
    return {
        source: content
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    traverseNode(root, context);
    // 2. 修改 text content
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 3 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
// 创建全局对象, 存储源对象及插件列表
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
function traverseNode(node, context) {
    // 遍历插件列表，分别使用插件进行转换
    const nodeTransforms = context.nodeTransforms;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 1 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 0 /* NodeTypes.ROOT */:
        case 3 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 3 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间处理层
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 1 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 4 /* NodeTypes.TEXT */ || node.type === 1 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 3 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            let currentContainer;
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            children.splice(j, 1);
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
/**
 * 创建虚拟节点函数
 * @param type 组件本身
 * @param props 组件属性
 * @param children 子组件
 * @returns 虚拟节点
 */
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        next: null, // 下次要更新的虚拟节点
        key: props === null || props === void 0 ? void 0 : props.key,
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
    return createVNode(Text, {}, text);
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
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

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
    $slots: (i) => i.slots, // $slots 的处理方法
    $props: (i) => i.props // $props 的处理方法
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
let compiler;
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
    if (compiler && !Component.render) {
        Component.render = compiler(Component.template);
    }
    instance.render = Component.render;
}
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
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

function shouldUpdateComponent(prevVnode, nextNode) {
    const { props: prevProp } = prevVnode;
    const { props: nextProps } = nextNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProp[key]) {
            return true;
        }
    }
    return false;
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
                 * 通过 createVNode 生成虚拟节点，其格式如下
                 * {
                 *  children // 子节点
                 *  el // 真实节点
                 *  props // 属性
                 *  type // 根组件（{render(){}, setup(){}}）
                 * }
                 */
                const vnode = createVNode(rootComponent);
                // 调用渲染函数
                render(vnode, rootContainer);
            }
        };
    };
}

const queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = true;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function createRenderer(options) {
    const { createElement: hostCreateElement, patchPro: hostPathPro, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    /**
     * render 渲染函数
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    /**
     * patch 对比节点更新
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     */
    function patch(n1, n2, container, parentComponent, anchor) {
        // ShapeFlags(标识n2 类型)
        const { type, shapeFlag } = n2;
        // Fragment => 只渲染 children
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    // 如果n2 是元素类型
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 如果n2 是组件类型
                    processComponent(n1, n2, container, parentComponent, anchor);
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
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || {};
        const newProps = n2.props || {};
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
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
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // array diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        const l2 = c2.length;
        let i = 0;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        function isSameVnodeType(n1, n2) {
            // type
            // key
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            i++;
        }
        // 右侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVnodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, parentAnchor);
            }
            else {
                break;
            }
            e1--;
            e2--;
        }
        // 新的比老的多-创建
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = e2 + 1 < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            // 老的比新的过-移除
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i;
            let s2 = i;
            // 需要比较的个数
            const toBePatched = e2 - s2 + 1;
            // 已对比的个数
            let patched = 0;
            const keyToNewIndexMap = new Map();
            let moved = false;
            let maxNewIndexSoFar = 0;
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++) {
                newIndexToOldIndexMap[i] = 0;
            }
            // 遍历新节点，构建映射表
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    // 如果已对比的个数大于需要对比的个数，则剩余的可以删除
                    hostRemove(prevChild.el);
                }
                let newIndex;
                if (prevChild.key !== null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    for (let j = s2; i <= e2; j++) {
                        if (isSameVnodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 如果不存在，则删除
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true;
                    }
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // 移动逻辑
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : [];
            let j = increasingNewIndexSequence.length - i;
            for (let i = toBePatched; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
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
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    /**
     * 挂载元素
     * @param vnode 虚拟节点
     * @param container 容器
     */
    function mountElement(vnode, container, parentComponent, anchor) {
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
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPathPro(el, key, null, val);
        }
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    /**
     * processComponent
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     * @param container 容器
     */
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    /**
     * 更新组件
     * @param n1 旧虚拟节点
     * @param n2 新虚拟节点
     */
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    /**
     * 挂载组件
     * @param initialVnode 虚拟节点
     * @param container 容器
     */
    function mountComponent(initialVnode, container, parentComponent, anchor) {
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
        const instance = (initialVnode.component = createComponentInstance(initialVnode, parentComponent));
        // 初始化组件状态
        setupComponent(instance);
        // 创建渲染效果
        setupRenderEffect(instance, initialVnode, container, anchor);
    }
    /**
     * 创建渲染效果
     * @param instance 组件实例
     * @param initialVnode 虚拟节点
     * @param container 容器
     */
    function setupRenderEffect(instance, initialVnode, container, anchor) {
        // 保存 update 函数
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 使render 函数的执行时指向 proxy对象，以获取正确数据
                // instance.subTree：记录当前的 subTree
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                patch(null, subTree, container, instance, anchor);
                // 把根阶段元素赋值组件元素
                initialVnode.el = subTree.el;
                // 标识已经挂载了
                instance.isMounted = true;
            }
            else {
                // 更新逻辑
                const { proxy, next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                // 当前最新subTree
                const subTree = instance.render.call(proxy, proxy);
                // 旧 subTree
                const prevSubTree = instance.subTree;
                // 更新 instance.subTree
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                console.log('update - scheduler');
                queueJobs(instance.update);
            }
        });
    }
    return {
        createApp: createAppAPI(render)
    };
}
function updateComponentPreRender(instance, nextVnode) {
    // 更新vnode
    instance.vnode = nextVnode;
    // 清空 next
    instance.next = null;
    // 更新 props
    instance.props = nextVnode.props;
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
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
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
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

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVnode: createTextVnode,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    toDisplayString: toDisplayString
});

function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVnode, getCurrentInstance, h, inject, nextTick, provide, proxyRefs, ref, registerRuntimeCompiler, renderSlots, toDisplayString };
