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
