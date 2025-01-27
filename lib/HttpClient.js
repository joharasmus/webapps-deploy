
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

let EnvironmentVariables = {};
EnvironmentVariables["HTTP_PROXY"] = "HTTP_PROXY";
EnvironmentVariables["HTTPS_PROXY"] = "HTTPS_PROXY";
EnvironmentVariables["NO_PROXY"] = "NO_PROXY";

export class HttpClient {
    constructor() {
        this._ignoreSslError = false;
        this._allowRedirects = true;
        this._allowRedirectDowngrade = false;
        this._maxRedirects = 50;
        this._allowRetries = false;
        this._maxRetries = 1;
        this._keepAlive = false;
        this._httpGlobalAgentOptions = {
            keepAlive: false,
            timeout: 30000
        };

        this.userAgent = undefined;
        this.handlers = [];

        this.requestOptions = undefined;
    }

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

        let req = info.httpModule.request(info.options, (msg) => {
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
        info.httpModule = https;
        info.options = {};
        info.options.host = info.parsedUrl.hostname;
        info.options.port = 443;
        info.options.path = info.parsedUrl.pathname + info.parsedUrl.search;
        info.options.method = method;
        info.options.timeout = this._socketTimeout;
        info.options.headers = Object.keys(headers).reduce((c, k) => (c[k.toLowerCase()] = headers[k], c), {});
        info.options.agent = this._getAgent(info.parsedUrl);
        return info;
    }

    _getAgent(parsedUrl) {

        // use global agent
        const globalAgentOptions = {
            keepAlive: this._httpGlobalAgentOptions.keepAlive,
            timeout: this._httpGlobalAgentOptions.timeout
        };
        let agent = new https.Agent(globalAgentOptions);

        if (this._certConfig) {
            console.log("YES");
            agent.options = Object.assign(agent.options || {}, { ca: this._ca, cert: this._cert, key: this._key, passphrase: this._certConfig.passphrase });
        }
        else
            console.log("NO");
        return agent;
    }
}
