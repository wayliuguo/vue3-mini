import { createRenderer } from '../runtime-core/index'

function createElement(type: any) {
    return document.createElement(type)
}

function patchPro(el: any, key: any, preVal: any, nextVal: any) {
    // 校验该props 是事件
    const isOn = (key: any) => /^on[A-Z]/.test(key)
    if (isOn(key)) {
        // 获取监听事件名称
        const event = key.slice(2).toLocaleLowerCase()
        // 如果是事件，则添加事件监听
        el.addEventListener(event, nextVal)
    } else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key)
        } else {
            el.setAttribute(key, nextVal)
        }
    }
}

function insert(el: any, parent: any) {
    parent.append(el)
}

function remove(child: any) {
    const parent = child.parentNode
    if (parent) {
        parent.removeChild(child)
    }
}

function setElementText(el: any, text: any) {
    el.textContent = text
}

const renderer = createRenderer({
    createElement,
    patchPro,
    insert,
    remove,
    setElementText
})

export function createApp(...args: [object]) {
    return renderer.createApp(...args)
}

export * from '../runtime-core/index'
