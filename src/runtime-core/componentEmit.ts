import { camelize, toHandleKey } from '../shared/index'

export function emit(instance: any, event: any, ...args: any) {
    const { props } = instance

    // 处理触发函数名称
    const handlerName = toHandleKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}
