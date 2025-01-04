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
exports.KuduServiceClient = void 0;
const core = __importStar(require("@actions/core"));
const util = __importStar(require("util"));
const WebClient_1 = require("azure-actions-webclient/WebClient");
class KuduServiceClient {
    constructor(scmUri, accessToken, accessTokenType) {
        this._accessToken = accessToken;
        this._accessTokenType = accessTokenType;
        this._scmUri = scmUri;
        this._webClient = new WebClient_1.WebClient();
    }
    beginRequest(request, reqOptions, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            request.headers = request.headers || {};
            request.headers["Authorization"] = `${this._accessTokenType} ${this._accessToken}`;
            request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';
            if (!!this._cookie) {
                core.debug(`setting affinity cookie ${JSON.stringify(this._cookie)}`);
                request.headers['Cookie'] = this._cookie;
            }
            let retryCount = reqOptions && util.isNumber(reqOptions.retryCount) ? reqOptions.retryCount : 5;
            while (retryCount >= 0) {
                try {
                    let httpResponse = yield this._webClient.sendRequest(request, reqOptions);
                    if (httpResponse.headers['set-cookie'] && !this._cookie) {
                        this._cookie = httpResponse.headers['set-cookie'];
                        core.debug(`loaded affinity cookie ${JSON.stringify(this._cookie)}`);
                    }
                    return httpResponse;
                }
                catch (exception) {
                    let exceptionString = exception.toString();
                    if (exceptionString.indexOf("Hostname/IP doesn't match certificates's altnames") != -1
                        || exceptionString.indexOf("unable to verify the first certificate") != -1
                        || exceptionString.indexOf("unable to get local issuer certificate") != -1) {
                        core.warning('To use a certificate in App Service, the certificate must be signed by a trusted certificate authority. If your web app gives you certificate validation errors, you\'re probably using a self-signed certificate and to resolve them you need to export variable named ACTIONS_AZURE_REST_IGNORE_SSL_ERRORS to the value true.');
                    }
                    if (retryCount > 0 && exceptionString.indexOf('Request timeout') != -1 && (!reqOptions || reqOptions.retryRequestTimedout)) {
                        core.debug('encountered request timedout issue in Kudu. Retrying again');
                        retryCount -= 1;
                        continue;
                    }
                    throw exception;
                }
            }
        });
    }
    getRequestUri(uriFormat, queryParameters) {
        uriFormat = uriFormat[0] == "/" ? uriFormat : "/" + uriFormat;
        if (queryParameters && queryParameters.length > 0) {
            uriFormat = uriFormat + '?' + queryParameters.join('&');
        }
        return this._scmUri + uriFormat;
    }
}
exports.KuduServiceClient = KuduServiceClient;
