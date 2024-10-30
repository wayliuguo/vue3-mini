import { NodeTypes } from './ast'

export function baseParse(content: string) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
    const nodes = []

    let node
    // 如果是插值表达式
    if (context.source.startsWith('{{')) {
        node = parseInterpolation(context)
    }
    nodes.push(node)

    return nodes
}

function parseInterpolation(context: any) {
    // {{ message }}
    // 开合标签
    const openDeliimiter = '{{'
    // 闭合标签
    const closeDelimiter = '}}'

    // 获取闭合下标
    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDeliimiter.length
    )

    // 推进-推进开合标签长度（去除开合标签）
    advanceBy(context, openDeliimiter.length)

    // 闭合下标 - 开合标签长度，即为内容长度
    const rawContentLength = closeIndex - openDeliimiter.length

    // 获取内容（可能携带空字格，需去除）
    const rawConent = context.source.slice(0, rawContentLength)
    // 去除空字格
    const content = rawConent.trim()

    // 推进-推进内容长度+闭合标签长度
    advanceBy(context, rawContentLength + closeDelimiter.length)

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content
        }
    }
}

// 推进函数，去除推进长度的开端字符
function advanceBy(context: any, length: number) {
    context.source = context.source.slice(length)
}

function createRoot(children: any) {
    return {
        children
    }
}

function createParseContext(content: string) {
    return {
        source: content
    }
}
