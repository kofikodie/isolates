import ivm from 'isolated-vm'
import fs from 'fs'
import yaml from 'yaml'
import { HandlerType } from './types/handler.type'
import express from 'express'

const serverlessConfig: HandlerType = yaml.parse(
    fs.readFileSync('./src/serverless.yml', 'utf8')
)

const handlerScript = serverlessConfig.handlers.map(handler => {
    const code = fs.readFileSync(`${handler.handler}`, 'utf8')

    const isolate = new ivm.Isolate({ memoryLimit: 8 /* MB */ })
    const script = isolate.compileScriptSync(code)
    const context = isolate.createContextSync()

    return {
        script: script.runSync(context),
        path: handler.path,
    }
})

const app = express()

handlerScript.forEach(handler => {
    app.get(handler.path, (_, res) => {
        res.send(handler.script)
    })
})

app.listen(3000, () => {
    console.log('Server running on port 3000')
})
