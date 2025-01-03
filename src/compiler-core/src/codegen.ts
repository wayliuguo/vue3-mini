import { isString } from '../../shared/index'
import { NodeTypes } from './ast'
import {
    CREATE_ELEMENT_VNODE,
    helperMapName,
    TO_DISPLAY_STRING
} from './runtimeHelpers'

export function generate(ast: any) {
    // 创建一个全局变量
    const context = createCodegenContext()
    // 全局变量提供 push 函数
    const { push } = context

    genFunctionPreamble(ast, context)

    const functionName = 'render'
    const args = ['_ctx', '_cache']
    const signature = args.join(', ')

    push(`function ${functionName}(${signature}){`)
    push('return ')

    genNode(ast.codegenNode, context)

    push('}')

    return {
        code: context.code
    }
}

function genFunctionPreamble(ast: any, context: any) {
    const { push } = context
    const VueBinging = 'Vue'
    // 别名处理函数
    const aliasHelper = (s: string) =>
        `${helperMapName[s]}:_${helperMapName[s]}`
    if (ast.helpers.length) {
        push(
            `const { ${ast.helpers
                .map(aliasHelper)
                .join(',')} } = ${VueBinging}`
        )
    }
    push('\n')
    push('return ')
}

function createCodegenContext() {
    const context = {
        code: '',
        push(source: string) {
            context.code += source
        },
        helper(key: string | symbol) {
            return `_${helperMapName[key]}`
        }
    }
    return context
}

function genNode(node: any, context: any) {
    switch (node.type) {
        case NodeTypes.TEXT:
            genText(node, context)
            break

        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break

        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break

        case NodeTypes.ELEMENT:
            genElement(node, context)
            break
        case NodeTypes.COMPOUND_EXPRESSION:
            genCompoundExpression(node, context)
            break
        default:
            break
    }
}

function genText(node: any, context: any) {
    const { push } = context
    push(`'${node.content}'`)
}

function genInterpolation(node: any, context: any) {
    const { push, helper } = context
    push(`${helper(TO_DISPLAY_STRING)}(`)
    genNode(node.content, context)
    push(')')
}

function genExpression(node: any, context: any) {
    const { push } = context

    push(`${node.content}`)
}

function genElement(node: any, context: any) {
    const { push, helper } = context
    const { tag, children, props } = node
    push(`${helper(CREATE_ELEMENT_VNODE)}(`)
    genNodeList(genNullable([tag, props, children]), context)

    push(')')
}

function genNullable(args: any) {
    return args.map((arg: any) => arg || 'null')
}

function genNodeList(nodes: any, context: any) {
    const { push } = context
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]
        if (isString(node)) {
            push(node)
        } else {
            genNode(node, context)
        }

        if (i < nodes.length - 1) {
            push(', ')
        }
    }
}

function genCompoundExpression(node: any, context: any) {
    const { push } = context
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        const child = children[i]
        if (isString(child)) {
            push(child)
        } else {
            genNode(child, context)
        }
    }
}
