import { NodeTypes } from './ast'

const enum TagType {
    START,
    END
}

export function baseParse(content: string) {
    const context = createParseContext(content)
    return createRoot(parseChildren(context, []))
}

function parseChildren(context: any, ancestors: any) {
    const nodes = []

    // 当未结束解析，继续处理
    while (!isEnd(context, ancestors)) {
        let node
        const s = context.source
        // 如果是插值表达式
        if (s.startsWith('{{')) {
            node = parseInterpolation(context)
        } else if (s[0] === '<') {
            // 如果是元素
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }

        // 解析 text
        if (!node) {
            node = parseText(context)
        }

        nodes.push(node)
    }

    return nodes
}

function isEnd(context: any, ancestors: any) {
    const s = context.source
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag

            if (startsWithEndTagOpen(s, tag)) {
                return true
            }
        }
    }
    return !s
}

function parseText(context: any) {
    let endIndex = context.source.length
    let endToken = ['<', '{{']

    for (let i = 0; i < endToken.length; i++) {
        // 如果匹配到插值表达式，则结束下标需调整
        const index = context.source.indexOf(endToken[i])
        // 如果匹配多个，取最靠小的下标
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }

    const content = parseTextData(context, endIndex)

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

function parseElement(context: any, ancestors: any) {
    const element: any = parseTag(context, TagType.START)
    ancestors.push(element)
    element.children = parseChildren(context, ancestors)
    ancestors.pop()

    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, TagType.END)
    } else {
        throw new Error(`缺少结束标签：${element.tag}`)
    }
    return element
}

function startsWithEndTagOpen(source: any, tag: any) {
    return (
        source.startsWith('<') &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
    )
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
        children,
        type: NodeTypes.ROOT
    }
}

function createParseContext(content: string) {
    return {
        source: content
    }
}
