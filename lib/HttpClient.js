
let awaiter = function (thisArg, generator) {
    return new Promise(function (resolve) {
        function fulfilled(value) { step(generator.next(value)); }
        function step(result) { result.done ? resolve(result.value) : result.value.then(fulfilled); }
        generator = generator.apply(thisArg);
        step(generator.next());
    });
};

import * as url from 'node:url';
import * as http from 'node:http';
import * as https from 'node:https';

let tunnel;

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
        let agent;
        let maxSockets = 100;

        if (!!this.requestOptions) {
            console.log("YES");
            maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
        }
        else
            console.log("NO");
        // if reusing agent across request and tunneling agent isn't assigned create a new agent
        if (this._keepAlive && !agent) {
            const options = { keepAlive: this._keepAlive, maxSockets: maxSockets };
            agent = new https.Agent(options);
            this._agent = agent;
        }
        // if not using private agent and tunnel agent isn't setup then use global agent
        if (!agent) {
            const globalAgentOptions = {
                keepAlive: this._httpGlobalAgentOptions.keepAlive,
                timeout: this._httpGlobalAgentOptions.timeout
            };
            agent = new https.Agent(globalAgentOptions);
        }
        if (this._ignoreSslError) {
            // we don't want to set NODE_TLS_REJECT_UNAUTHORIZED=0 since that will affect request for entire process
            // http.RequestOptions doesn't expose a way to modify RequestOptions.agent.options
            // we have to cast it to any and change it directly
            agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
        }
        if (this._certConfig) {
            agent.options = Object.assign(agent.options || {}, { ca: this._ca, cert: this._cert, key: this._key, passphrase: this._certConfig.passphrase });
        }
        return agent;
    }

    _getProxy(parsedUrl) {
        let usingSsl = parsedUrl.protocol === 'https:';
        let proxyConfig = this._httpProxy;
        // fallback to http_proxy and https_proxy env
        let https_proxy = process.env[EnvironmentVariables.HTTPS_PROXY];
        let http_proxy = process.env[EnvironmentVariables.HTTP_PROXY];
        if (!proxyConfig) {
            if (https_proxy && usingSsl) {
                proxyConfig = {
                    proxyUrl: https_proxy
                };
            }
            else if (http_proxy) {
                proxyConfig = {
                    proxyUrl: http_proxy
                };
            }
        }
        let proxyUrl;
        let proxyAuth;
        if (proxyConfig) {
            if (proxyConfig.proxyUrl.length > 0) {
                proxyUrl = url.parse(proxyConfig.proxyUrl);
            }
            if (proxyConfig.proxyUsername || proxyConfig.proxyPassword) {
                proxyAuth = proxyConfig.proxyUsername + ":" + proxyConfig.proxyPassword;
            }
        }
        return { proxyUrl: proxyUrl, proxyAuth: proxyAuth };
    }

    _isMatchInBypassProxyList(parsedUrl) {
        if (!this._httpProxyBypassHosts) {
            return false;
        }
        let bypass = false;
        this._httpProxyBypassHosts.forEach(bypassHost => {
            if (bypassHost.test(parsedUrl.href)) {
                bypass = true;
            }
        });
        return bypass;
    }
}
