const publicPropertiesMap = {
    $el: (i: any) => i.vnode.el // $el 的处理方法
} as any

export const PublicInstanceProxyHandlers = {
    get({ _: instance }: any, key: any) {
        // 优选从已注册的数据中返回
        const { setupState } = instance
        if (key in setupState) {
            return setupState[key]
        }

        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }
}
