// 对象属性合并
export const extend = Object.assign
// reactive 标识枚举
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly',
    IS_REF = '__v_isRef'
}
// 判断是对象
export const isObject = (val: any) => val !== null && typeof val === 'object'

// 是否变更
export const hanChanged = (val: any, newValue: any) => !Object.is(val, newValue) 

// 是否包含属性
export const hasOwn = (val: any, key: any) => Object.prototype.hasOwnProperty.call(val, key)

// 横线变为驼峰，add-foo => addFoo
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c: string) => {
        return c ? c.toUpperCase() : ''
    })
}

// 字符串第一个变大写（add => Add）
export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

// 添加前缀 on add => onAdd
export const toHandleKey = (str: string) => {
    return str ? 'on' + capitalize(str) : ''
}
