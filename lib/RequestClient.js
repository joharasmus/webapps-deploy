"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestClient = void 0;
const HttpClient_1 = require("typed-rest-client/HttpClient");
class RequestClient {
    constructor() {
        this.options = {
            ignoreSslError: false
        };
        this.instance = new HttpClient_1.HttpClient(`${process.env.AZURE_HTTP_USER_AGENT}`, undefined, this.options);
    }
}
exports.RequestClient = RequestClient;
