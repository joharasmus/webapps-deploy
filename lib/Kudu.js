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
exports.Kudu = exports.KUDU_DEPLOYMENT_CONSTANTS = void 0;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("fs"));
const io_util_1 = require("@actions/io/lib/io-util");
const KuduServiceClient_1 = require("./KuduServiceClient");
exports.KUDU_DEPLOYMENT_CONSTANTS = {
    SUCCESS: 4,
    FAILED: 3
};
class Kudu {
    constructor(scmUri, credentials) {
        const accessToken = typeof credentials === 'string'
            ? credentials
            : (new Buffer(credentials.username + ':' + credentials.password).toString('base64'));
        const accessTokenType = typeof credentials === 'string' ? "Bearer" : "Basic";
        this._client = new KuduServiceClient_1.KuduServiceClient(scmUri, accessToken, accessTokenType);
    }
    updateDeployment(requestBody) {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'PUT',
                body: JSON.stringify(requestBody),
                uri: this._client.getRequestUri(`/api/deployments/${requestBody.id}`)
            };
            try {
                let webRequestOptions = { retriableErrorCodes: [], retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: true };
                var response = yield this._client.beginRequest(httpRequest, webRequestOptions);
                core.debug(`updateDeployment. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    console.log("Successfully updated deployment History at " + response.body.url);
                    return response.body.id;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to update deployment history.\n" + this._getFormattedError(error));
            }
        });
    }
    getAppSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/settings`)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                var responseBody = JSON.stringify(response.body);
                var appSettingsMap = JSON.parse(responseBody);
                core.debug(`App settings: ${Object.keys(appSettingsMap)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to fetch Kudu App Settings.\n" + this._getFormattedError(error));
            }
        });
    }
    getAppRuntime() {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/diagnostics/runtime`)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`getAppRuntime. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                core.debug("Failed to fetch Kudu App Runtime diagnostics.\n" + this._getFormattedError(error));
                throw Error(error);
            }
        });
    }
    runCommand(physicalPath, command) {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/command`),
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'If-Match': '*'
                },
                body: JSON.stringify({
                    'command': command,
                    'dir': physicalPath
                })
            };
            try {
                core.debug('Executing Script on Kudu. Command: ' + command);
                let webRequestOptions = { retriableErrorCodes: null, retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: false };
                var response = yield this._client.beginRequest(httpRequest, webRequestOptions);
                core.debug(`runCommand. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error(error.toString());
            }
        });
    }
    extractZIP(webPackage, physicalPath) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'PUT',
                uri: this._client.getRequestUri(`/api/zip/${physicalPath}/`),
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'If-Match': '*'
                },
                body: fs.createReadStream(webPackage)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`extractZIP. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error("Failed to deploy App Service package using kudu service.\n" + this._getFormattedError(error));
            }
        });
    }
    zipDeploy(webPackage, queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/zipdeploy`, queryParameters),
                body: fs.createReadStream(webPackage)
            };
            try {
                let response = yield this._client.beginRequest(httpRequest, null, 'application/octet-stream');
                core.debug(`ZIP Deploy response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    core.debug('Deployment passed');
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        core.debug(`Polling for ZIP Deploy URL: ${pollableURL}`);
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
                    }
                    else {
                        core.debug('zip deploy returned 202 without pollable URL.');
                        return null;
                    }
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                const deploymentError = new Error("Failed to deploy web package to App Service.\n" + this._getFormattedError(error));
                deploymentError.statusCode = error.statusCode;
                throw deploymentError;
            }
        });
    }
    imageDeploy(headers) {
        return __awaiter(this, void 0, void 0, function* () {
            const _Error = "Error";
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/app/update`),
                headers: headers
            };
            let response = yield this._client.beginRequest(httpRequest, null);
            core.debug(`Image Deploy response: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                if (!!response.body && typeof response.body === 'object' && _Error in response.body) {
                    throw response.body[_Error];
                }
            }
            else {
                throw JSON.stringify(response);
            }
            core.debug('Deployment passed');
        });
    }
    warDeploy(webPackage, queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/wardeploy`, queryParameters),
                body: fs.createReadStream(webPackage)
            };
            try {
                let response = yield this._client.beginRequest(httpRequest, null, 'application/octet-stream');
                core.debug(`War Deploy response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    core.debug('Deployment passed');
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        core.debug(`Polling for War Deploy URL: ${pollableURL}`);
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
                    }
                    else {
                        core.debug('war deploy returned 202 without pollable URL.');
                        return null;
                    }
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error("Failed to deploy web package to App Service.\n" + this._getFormattedError(error));
            }
        });
    }
    oneDeploy(webPackage, queryParameters) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`/api/publish`, queryParameters),
                body: fs.createReadStream(webPackage)
            };
            try {
                let response = yield this._client.beginRequest(httpRequest, null, 'application/octet-stream');
                core.debug(`One Deploy response: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    core.debug('Deployment passed');
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        core.debug(`Polling for One Deploy URL: ${pollableURL}`);
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
                    }
                    else {
                        core.debug('One Deploy returned 202 without pollable URL.');
                        return null;
                    }
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error("Failed to deploy web package using OneDeploy to App Service.\n" + this._getFormattedError(error));
            }
        });
    }
    getDeploymentDetails(deploymentID) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: this._client.getRequestUri(`/api/deployments/${deploymentID}`)
                };
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`getDeploymentDetails. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to gte deployment logs.\n" + this._getFormattedError(error));
            }
        });
    }
    getDeploymentLogs(log_url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var httpRequest = {
                    method: 'GET',
                    uri: log_url
                };
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`getDeploymentLogs. Data: ${JSON.stringify(response)}`);
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to gte deployment logs.\n" + this._getFormattedError(error));
            }
        });
    }
    getFileContent(physicalPath, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                }
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`getFileContent. Status code: ${response.statusCode} - ${response.statusMessage}`);
                if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                    return response.body;
                }
                else if (response.statusCode === 404) {
                    return null;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error("Failed to get file content " + physicalPath + fileName + " from Kudu.\n" + this._getFormattedError(error));
            }
        });
    }
    uploadFile(physicalPath, fileName, filePath) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            if (!(yield (0, io_util_1.exists)(filePath))) {
                throw new Error('FilePathInvalid' + filePath);
            }
            var httpRequest = {
                method: 'PUT',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                },
                body: fs.createReadStream(filePath)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`uploadFile. Data: ${JSON.stringify(response)}`);
                if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to upload file " + physicalPath + fileName + " from Kudu.\n" + this._getFormattedError(error));
                ;
            }
        });
    }
    deleteFile(physicalPath, fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            physicalPath = physicalPath.replace(/[\\]/g, "/");
            physicalPath = physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
            var httpRequest = {
                method: 'DELETE',
                uri: this._client.getRequestUri(`/api/vfs/${physicalPath}/${fileName}`),
                headers: {
                    'If-Match': '*'
                }
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                core.debug(`deleteFile. Data: ${JSON.stringify(response)}`);
                if ([200, 201, 204, 404].indexOf(response.statusCode) != -1) {
                    return;
                }
                else {
                    throw response;
                }
            }
            catch (error) {
                throw Error("Failed to delete file " + physicalPath + fileName + " from Kudu.\n" + this._getFormattedError(error));
                ;
            }
        });
    }
    _getDeploymentDetailsFromPollURL(pollURL) {
        return __awaiter(this, void 0, void 0, function* () {
            let httpRequest = {
                method: 'GET',
                uri: pollURL,
                headers: {}
            };
            while (true) {
                let response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode == 200 || response.statusCode == 202) {
                    var result = response.body;
                    core.debug(`POLL URL RESULT: ${JSON.stringify(response)}`);
                    if (result.status == exports.KUDU_DEPLOYMENT_CONSTANTS.SUCCESS || result.status == exports.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                        return result;
                    }
                    else {
                        core.debug(`Deployment status: ${result.status} '${result.status_text}'. retry after 5 seconds`);
                        yield this._sleep(5);
                        continue;
                    }
                }
                else {
                    throw response;
                }
            }
        });
    }
    _getFormattedError(error) {
        if (error && error.statusCode) {
            return `${error.statusMessage} (CODE: ${error.statusCode})`;
        }
        else if (error && error.message) {
            if (error.statusCode) {
                error.message = `${typeof error.message.valueOf() == 'string' ? error.message : error.message.Code + " - " + error.message.Message} (CODE: ${error.statusCode})`;
            }
            return error.message;
        }
        return error;
    }
    _sleep(sleepDurationInSeconds) {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
}
exports.Kudu = Kudu;