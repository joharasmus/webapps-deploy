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
exports.WebClient = void 0;
const RequestClient_1 = require("./RequestClient");
class WebClient {
    constructor() {
        this._httpClient = new RequestClient_1.RequestClient().instance;
    }
    sendRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let response = yield this._httpClient.request(request.method, request.uri, request.body || '', request.headers);
            let body = yield response.readBody();
            return {
                statusCode: response.message.statusCode,
                statusMessage: response.message.statusMessage,
                headers: response.message.headers,
                body: body
            };
        });
    }
}
exports.WebClient = WebClient;
