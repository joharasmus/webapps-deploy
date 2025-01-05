"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebClient = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const RequestClient_1 = require("./RequestClient");
const DEFAULT_RETRIABLE_ERROR_CODES = ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "ESOCKETTIMEDOUT", "ECONNREFUSED", "EHOSTUNREACH", "EPIPE", "EA_AGAIN"];
const DEFAULT_RETRIABLE_STATUS_CODES = [408, 409, 500, 502, 503, 504];
const DEFAULT_RETRY_COUNT = 5;
const DEFAULT_RETRY_INTERVAL_SECONDS = 2;
class WebClient {
    constructor() {
        this._httpClient = RequestClient_1.RequestClient.GetInstance();
    }
    sendRequest(request, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let i = 0;
            let retryCount = options && options.retryCount ? options.retryCount : DEFAULT_RETRY_COUNT;
            let retryIntervalInSeconds = options && options.retryIntervalInSeconds ? options.retryIntervalInSeconds : DEFAULT_RETRY_INTERVAL_SECONDS;
            let retriableErrorCodes = options && options.retriableErrorCodes ? options.retriableErrorCodes : DEFAULT_RETRIABLE_ERROR_CODES;
            let retriableStatusCodes = options && options.retriableStatusCodes ? options.retriableStatusCodes : DEFAULT_RETRIABLE_STATUS_CODES;
            let timeToWait = retryIntervalInSeconds;
            while (true) {
                try {
                    if (request.body && typeof (request.body) !== 'string' && !request.body["readable"]) {
                        request.body = fs.createReadStream(request.body["path"]);
                    }
                    let response = yield this._sendRequestInternal(request);
                    if (retriableStatusCodes.indexOf(response.statusCode) != -1 && ++i < retryCount) {
                        core.debug(`Encountered a retriable status code: ${response.statusCode}. Message: '${response.statusMessage}'.`);
                        yield this._sleep(timeToWait);
                        timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                        continue;
                    }
                    return response;
                }
                catch (error) {
                    if (retriableErrorCodes.indexOf(error.code) != -1 && ++i < retryCount) {
                        core.debug(`Encountered a retriable error:${error.code}. Message: ${error.message}.`);
                        yield this._sleep(timeToWait);
                        timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                    }
                    else {
                        if (error.code) {
                            core.error(error.code);
                        }
                        throw error;
                    }
                }
            }
        });
    }
    _sendRequestInternal(request) {
        return __awaiter(this, void 0, void 0, function* () {
            core.debug(`[${request.method}] ${request.uri}`);
            let response = yield this._httpClient.request(request.method, request.uri, request.body || '', request.headers);
            if (!response) {
                throw new Error(`Unexpected end of request. Http request: [${request.method}] ${request.uri} returned a null Http response.`);
            }
            return yield this._toWebResponse(response);
        });
    }
    _toWebResponse(response) {
        return __awaiter(this, void 0, void 0, function* () {
            let resBody;
            let body = yield response.readBody();
            if (!!body) {
                try {
                    resBody = JSON.parse(body);
                }
                catch (error) {
                    core.debug(`Could not parse response body.`);
                    core.debug(JSON.stringify(error));
                }
            }
            return {
                statusCode: response.message.statusCode,
                statusMessage: response.message.statusMessage,
                headers: response.message.headers,
                body: resBody || body
            };
        });
    }
    _sleep(sleepDurationInSeconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
}
exports.WebClient = WebClient;
