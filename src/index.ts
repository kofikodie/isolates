import ivm from 'isolated-vm'
import fs from 'fs'
import yaml from 'yaml'
import { HandlerType } from './types/handler.type'
import express from 'express'
import path from 'path'

const serverlessConfig: HandlerType = yaml.parse(
    fs.readFileSync(path.resolve(__dirname, 'serverless.yml'), 'utf8')
)

const handlerScript = serverlessConfig.handlers.map(handler => {    
    const code = fs.readFileSync(path.resolve(__dirname, `${handler.handler}`), 'utf8')

    const isolate = new ivm.Isolate({ memoryLimit: 8 /* MB */ })
    const script = isolate.compileScriptSync(code)
    const context = isolate.createContextSync()

    return {
        script: script.runSync(context),
        path: handler.path,
    }
})

//create an express server api for each handler
handlerScript.forEach((handler, index) => {
    const port = 3000 + index
    express()
        .get(handler.path, (_, res) => {
            res.send(handler.script)
        })
        .listen(port, () => {
            console.log(`Server running on port ${port}`)
        })
})
/*const app = express()

handlerScript.forEach(handler => {
    app.get(handler.path, (_, res) => {
        res.send(handler.script)
    })
})

app.listen(3000, () => {
    console.log('Server running on port 3000')
})*/
