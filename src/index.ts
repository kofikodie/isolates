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
    const func = async (
        parameter: string,
        response: http.ServerResponse
    ) => {
        const { code } = handler
        const isolate = new ivm.Isolate({ memoryLimit: 8 });
        const context =  isolate.createContextSync();

        const memBefore = process.memoryUsage().heapUsed / (1024 * 1024);

        const jail = context.global;
        const functionCode = new Function(`return ${code}`)();
        jail.setSync('handlerFunction', functionCode);

        const res = context.evalSync(`handlerFunction(${JSON.stringify(parameter)})`);

        const stats = await isolate.getHeapStatistics();
        console.log(stats);

        const memAfter = process.memoryUsage().heapUsed / (1024 * 1024);
        const memDiff = memAfter - memBefore;

        console.log(`Memory used before execution: ${memBefore.toFixed(2)} MB`);
        console.log(`Memory used after execution: ${memAfter.toFixed(2)} MB`);
        console.log(`Memory difference: ${memDiff.toFixed(2)} MB`);

        response.statusCode = 200;
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ res }));
        isolate.dispose();
    }

    return {
        path: handler.path,
        handler: func,
    }
})

http.createServer(async (request, response) => {
    const { url } = request;
    if (!url) {
        response.statusCode = 404;
        response.end();
        return;
    }

    const urlParts = url.split("/");
    const path = urlParts[1];
    const parameter = urlParts[2];

    const lambda = lambdas.find(lambda => lambda.path === `/${path}`);

    if (lambda) {
        // Pass the parameter to the lambda function as an argument
        await lambda.handler(parameter, response);
    } else {
        response.statusCode = 404;
        response.end();
    }
}).listen(3000);