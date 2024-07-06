// 对象属性合并
export const extend = Object.assign
// reactive 标识枚举
export const enum ReactiveFlags {
    IS_REACTIVE = '__v_isReactive',
    IS_READONLY = '__v_isReadonly'
}
// 判断是对象
export const isObject = (val: any) => val !== null && typeof val === 'object'
