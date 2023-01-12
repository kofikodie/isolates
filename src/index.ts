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

    return {
        path: handler.path,
        code,
    }
})

const lambdas = handlerScript.map(handler => {
    const func = (
        request: http.IncomingMessage,
        response: http.ServerResponse
    ) => {
        const { code } = handler

        /*const isolate = new ivm.Isolate;
        const context = isolate.createContextSync();
        const global = context.global;
        global.setSync('global', global.derefInto());
        isolate.compileScriptSync(`global.run = (request) => ${code}`).runSync(context);*/

        const isolate = new ivm.Isolate({ memoryLimit: 8 });

        const context =  isolate.createContextSync();

        const script =  isolate.compileScriptSync(code);
        script.runSync(context);

        const input = new ivm.ExternalCopy({
            Subreddit: 'r/test',
            Title: 'my title',
            Content: 'my content',
            PostUrl: 'www.ifttt.com'
        })

        const fnReference =  context.global.getSync('lambdaHandler');
        console.log(`${fnReference}`)

        fnReference.applySync(undefined, [input], {
            timeout: 3000,
            promise: true,
            reference: {
                copy: true
            }
        });

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.parse(JSON.stringify("res")))
    }

    return {
        path: handler.path,
        handler: func,
    }
})

//https://github.com/EarlMadSec/minTAP/blob/ee00b538fc77dee16db8575d56efb08a0a66aaa1/Server/isolated_server/test.js
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
