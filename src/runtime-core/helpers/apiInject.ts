import { getCurrentInstance } from '../components'

export function provide(key: any, value: any) {
    // 获取组件实例对象
    const currentInstance: any = getCurrentInstance()

    if (currentInstance) {
        let { provides } = currentInstance

        const parentProvides = currentInstance.parent.provides

        // 由于初始化的时候（createComponentInstance处）指定了当前的provides 等于了父组件的 provides
        // 所以这个时候，如果相等，则认为是初始化
        if (provides === parentProvides) {
            // 更改子组件的provides原型指向父组件原型
            provides = currentInstance.provides = Object.create(parentProvides)
        }
        provides[key] = value
    }
}

export function inject(key: any, defaultValue: any) {
    // 获取组件实例对象
    const currentInstance: any = getCurrentInstance()

    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides

        if (key in parentProvides) {
            // 如果存在，则返回 provide 的值
            return parentProvides[key]
        } else if (defaultValue) {
            // 如果不存在，则返回默认值
            if (typeof defaultValue === 'function') {
                return defaultValue()
            }
            return defaultValue
        }
    }
}
