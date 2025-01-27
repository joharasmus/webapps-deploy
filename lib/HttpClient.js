
let awaiter = function (thisArg, generator) {
    return new Promise(function (resolve) {
        function fulfilled(value) { step(generator.next(value)); }
        function step(result) { result.done ? resolve(result.value) : result.value.then(fulfilled); }
        generator = generator.apply(thisArg);
        step(generator.next());
    });
};

import * as https from 'node:https';


class HttpClientResponse {
    constructor(message) {
        this.message = message;
    }

    readBody() {
        const chunks = [];
        const encodingCharset = 'utf-8';
        this.message.on('data', function (data) {
            chunks.push(data);
        });
        return new Promise((resolve) => awaiter(this, function* () {
            this.message.on('end', function () {
                const buffer = Buffer.concat(chunks);
                resolve(buffer.toString(encodingCharset));
            });
    }));
    }
}

export class HttpClient {

    async request(verb, requestUrl, data, headers) {
        let parsedUrl = new URL(requestUrl);
        let info = this._prepareRequest(verb, parsedUrl, headers);
        return awaiter(this, function* () {
            let response = yield this.requestRaw(info, data);
            return response;
        });
    }

    requestRaw(info, data) {
        return new Promise((resolve) => {
            let callbackForResult = function (res) { resolve(res); };
            this.requestRawWithCallback(info, data, callbackForResult);
        });
    }

    requestRawWithCallback(info, data, onResult) {
        if (typeof (data) === 'string') {
            info.options.headers["Content-Length"] = Buffer.byteLength(data, 'utf8');
        }

        let req = https.request(info.options, (msg) => {
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

    _prepareRequest(method, requestUrl, headers) {
        const info = {};
        info.parsedUrl = requestUrl;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = 443;
        info.options.path = info.parsedUrl.pathname + info.parsedUrl.search;
        info.options.method = method;

        info.options.headers = Object.keys(headers).reduce((c, k) => (c[k] = headers[k], c), {});

        const globalAgentOptions = {
            keepAlive: false,
            timeout: 30000
        };

        let agent = new https.Agent(globalAgentOptions);

        info.options.agent = agent;
        return info;
    }
}
