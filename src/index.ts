import ivm from 'isolated-vm'
import fs from 'fs'
import yaml from 'yaml'
import { HandlerType } from './types/handler.type'
import path from 'path'
import * as http from 'http'

const serverlessConfig: HandlerType = yaml.parse(
    fs.readFileSync(path.resolve(__dirname, 'serverless.yml'), 'utf8')
)

const handlerScript = serverlessConfig.handlers.map(handler => {
    const code = fs.readFileSync(
        path.resolve(__dirname, `${handler.handler}`),
        'utf8'
    )

    const isolate = new ivm.Isolate({ memoryLimit: 8 /* MB */ })
    const script = isolate.compileScriptSync(code)
    const context = isolate.createContextSync()

    return {
        script: script.runSync(context),
        path: handler.path,
    }
})

const lambdas = handlerScript.map(handler => {
    const func = (
        request: http.IncomingMessage,
        response: http.ServerResponse
    ) => {
        const { script } = handler

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.end(script)
        return
    }

    return {
        path: handler.path,
        handler: func,
    }
})

http.createServer((request, response) => {
    const { url } = request

    const lambda = lambdas.find(lambda => lambda.path === url)
    if (lambda) {
        lambda.handler(request, response)
    } else {
        response.statusCode = 404
        response.end()
    }
}).listen(3000)
