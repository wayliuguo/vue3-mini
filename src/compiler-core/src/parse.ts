import { NodeTypes } from './ast'

const enum TagType {
    START,
    END
}

export function baseParse(content: string) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
    const nodes = []

    let node
    const s = context.source
    // 如果是插值表达式
    if (s.startsWith('{{')) {
        node = parseInterpolation(context)
    } else if (s[0] === '<') {
        // 如果是元素
        if (/[a-z]/i.test(s[1])) {
            node = parseElement(context)
        }
    }

    // 解析 text
    if (!node) {
        node = parseText(context)
    }

    nodes.push(node)

    return nodes
}

function parseText(context: any) {
    const content = parseTextData(context, context.source.length)

    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context: any, length: number) {
    const content = context.source.slice(0, length)
    advanceBy(context, length)
    return content
}

function parseElement(context: any) {
    const element = parseTag(context, TagType.START)
    parseTag(context, TagType.END)
    return element
}

function parseTag(context: any, type: TagType) {
    // 1. 解析 tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source)
    const tag = match[1]
    // 2. 删除解析完成的代码
    advanceBy(context, match[0].length)
    advanceBy(context, 1)

    // 如果是结束标签，则结束
    if (type === TagType.END) return
    return {
        type: NodeTypes.ELEMENT,
        tag
    }
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
    const rawConent = parseTextData(context, rawContentLength)
    // 去除空字格
    const content = rawConent.trim()

    // 推进-推进内容长度+闭合标签长度
    advanceBy(context, closeDelimiter.length)

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
