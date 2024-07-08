import { createVnode } from './vnode'

export function createApp(rootComponent: any) {
    return {
        mount(rootContainer: any) {
            // components --> vnode
            const vnode = createVnode(rootComponent)

            render()
        }
    }
}
