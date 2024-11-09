import { NodeTypes } from './ast'
import { TO_DISPLAY_STRING } from './runtimeHelpers'

export function transform(root: any, options: any = {}) {
    const context = createTransformContext(root, options)
    // 1. 遍历 - 深度优先搜索
    traverseNode(root, context)
    // 2. 修改 text content
    createRootCodegen(root)

    root.helpers = [...context.helpers.keys()]
}

function createRootCodegen(root: any) {
    const child = root.children[0]
    if (child.type === NodeTypes.ELEMENT) {
        root.codegenNode = child.codegenNode
    } else {
        root.codegenNode = root.children[0]
    }
}

// 创建全局对象, 存储源对象及插件列表
function createTransformContext(root: any, options: any) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key: string) {
            context.helpers.set(key, 1)
        }
    }
    return context
}

function traverseNode(node: any, context: any) {
    // 遍历插件列表，分别使用插件进行转换
    const nodeTransforms = context.nodeTransforms
    const exitFns: any = []

    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i]
        const onExit = transform(node, context)
        if (onExit) exitFns.push(onExit)
    }

    switch (node.type) {
        case NodeTypes.INTERPOLATION:
            context.helper(TO_DISPLAY_STRING)
            break
        case NodeTypes.ROOT:
        case NodeTypes.ELEMENT:
            traverseChildren(node, context)
            break
        default:
            break
    }

    let i = exitFns.length
    while (i--) {
        exitFns[i]()
    }
}

function traverseChildren(node: any, context: any) {
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const node = children[i]
        traverseNode(node, context)
    }
}
