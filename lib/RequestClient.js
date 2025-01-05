"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestClient = void 0;
const HttpClient_1 = require("typed-rest-client/HttpClient");
class RequestClient {
    constructor() {
        // Singleton pattern: block from public construction
        RequestClient._options = {};
        let ignoreSslErrors = `${process.env.ACTIONS_AZURE_REST_IGNORE_SSL_ERRORS}`;
        RequestClient._options.ignoreSslError = !!ignoreSslErrors && ignoreSslErrors.toLowerCase() === "true";
        RequestClient._instance = new HttpClient_1.HttpClient(`${process.env.AZURE_HTTP_USER_AGENT}`, undefined, RequestClient._options);
    }
    static GetInstance() {
        if (RequestClient._instance === undefined) {
            new RequestClient();
        }
        return RequestClient._instance;
    }
    static SetOptions(newOptions) {
        RequestClient._options = newOptions;
    }
}
exports.RequestClient = RequestClient;