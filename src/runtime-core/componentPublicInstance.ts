import { hasOwn } from '../shared/index'

const publicPropertiesMap = {
    $el: (i: any) => i.vnode.el // $el 的处理方法
} as any

export const PublicInstanceProxyHandlers = {
    get({ _: instance }: any, key: any) {
        // 优选从已注册的数据中返回
        const { setupState, props } = instance
        if (key in setupState) {
            return setupState[key]
        }

        if (hasOwn(setupState, key)) {
            return setupState[key]
        } else if (hasOwn(props, key)) {
            return props[key]
        }

        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }
}
