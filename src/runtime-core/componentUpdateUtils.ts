export function shouldUpdateComponent(prevVnode: any, nextNode: any) {
    const { props: prevProp } = prevVnode
    const { props: nextProps } = nextNode

    for (const key in nextProps) {
        if (nextProps[key] !== prevProp[key]) {
            return true
        }
    }

    return false
}
