
import * as https from 'node:https';


class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }

    readBody() {
        const chunks = [];
        this.message.on('data', function (data) {
            chunks.push(data);
        });
        return new Promise((resolve) => {
            this.message.on('end', function () {
                const buffer = Buffer.concat(chunks);
                resolve(buffer.toString('utf-8'));
            });
        });
    }
}

export class HttpClient {

    awaiter = function (generator) {
        return new Promise(function (resolve) {
            function fulfilled(value) { 
                let res = generator.next(value);
                resolve(res.value); 
            }
            function step(result) {
                result.done ? resolve(result.value) : result.value.then(fulfilled); 
            }
            step(generator.next());
        });
    };

    request(verb, requestUrl, data, headers) {
        let parsedUrl = new URL(requestUrl);
        let options = this._prepareRequest(verb, parsedUrl, headers);
        return this.awaiter(function* () {
            let response = yield this.requestRaw(options, data);
            return response;
        }.apply(this));
    }

    requestRaw(options, data) {
        return new Promise((resolve) => {
            let callbackForResult = function (res) { resolve(res); };
            this.requestRawWithCallback(options, data, callbackForResult);
        });
    }

    requestRawWithCallback(options, data, onResult) {
        if (typeof (data) === 'string') {
            options.headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
        }

        let req = https.request(options, (msg) => {
            let res = new HttpClientResponse(msg);
            onResult(res);
        });

        if (data) {
            data.on('close', function () {
                req.end();
            });
            data.pipe(req);
        }
        else {
            req.end();
        }
    }

    _prepareRequest(verb, parsedUrl, headers) {
        const options = {};
        options.host = parsedUrl.hostname;
        options.port = 443;
        options.path = parsedUrl.pathname + parsedUrl.search;
        options.method = verb;
        options.headers = headers;

        const agentOptions = {};
        agentOptions.keepAlive = false;
        agentOptions.timeout = 30000;

        let agent = new https.Agent(agentOptions);

        options.agent = agent;
        return options;
    }
}
