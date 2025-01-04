"use strict";
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
const WebClient_1 = require("azure-actions-webclient/WebClient");
class KuduServiceClient {
    constructor(accessToken) {
        this._accessToken = accessToken;
        this._webClient = new WebClient_1.WebClient();
    }
    beginRequest(request, contentType) {
        return __awaiter(this, void 0, void 0, function* () {
            request.headers = {};
            request.headers["Authorization"] = `Basic ${this._accessToken}`;
            request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';
            let retryCount = 3;
            while (retryCount >= 0) {
                try {
                    return yield this._webClient.sendRequest(request);
                }
                catch (exception) {
                    let exceptionString = exception.toString();
                    if (retryCount > 0 && exceptionString.indexOf('Request timeout') != -1) {
                        retryCount -= 1;
                        continue;
                    }
                    throw exception;
                }
            }
        });
    }
}
exports.KuduServiceClient = KuduServiceClient;
