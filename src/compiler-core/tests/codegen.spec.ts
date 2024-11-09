import { generate } from '../src/codegen'
import { baseParse } from '../src/parse'
import { transform } from '../src/transform'
import { transformElement } from '../src/transforms/transformElement'
import { transformExpression } from '../src/transforms/transformExpression'

describe('codegen', () => {
    it('string', () => {
        const ast = baseParse('hi')
        transform(ast)
        const { code } = generate(ast)

        // 快照（string),两种用处：
        // 1. 抓bug
        // 2. 有意更新快照
        expect(code).toMatchSnapshot()
    })

    it('interpolation', () => {
        const ast = baseParse('{{message}}')
        transform(ast, {
            nodeTransforms: [transformExpression]
        })
        const { code } = generate(ast)
        expect(code).toMatchSnapshot()
    })

    it('interpolation', () => {
        const ast = baseParse('<div></div>')
        transform(ast, {
            nodeTransforms: [transformElement]
        })
        const { code } = generate(ast)
        expect(code).toMatchSnapshot()
    })
})
