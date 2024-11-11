import { baseCompile } from './compiler-core/src/index'
import * as runtimeDom from './runtime-dom/index'

export * from './runtime-dom/index'

function compileToFunction(template: any) {
    const { code } = baseCompile(template)
    const render = new Function('Vue', code)(runtimeDom)
    return render
}

runtimeDom.registerRuntimeCompiler(compileToFunction)
