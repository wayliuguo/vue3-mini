import { CREATE_ELEMENT_VNODE } from './runtimeHelpers'

export const enum NodeTypes {
    ROOT,
    INTERPOLATION,
    SIMPLE_EXPRESSION,
    ELEMENT,
    TEXT,
    COMPOUND_EXPRESSION
}

export function createVNodeCall(
    context: any,
    tag: any,
    props: any,
    children: any
) {
    context.helper(CREATE_ELEMENT_VNODE)
    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children
    }
}
