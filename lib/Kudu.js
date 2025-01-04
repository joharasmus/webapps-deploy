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
exports.Kudu = void 0;
const fs = __importStar(require("fs"));
const KuduServiceClient_1 = require("./KuduServiceClient");
class Kudu {
    constructor(scmUri, username, password) {
        const accessToken = Buffer.from(username + ':' + password).toString('base64');
        this._client = new KuduServiceClient_1.KuduServiceClient(scmUri, accessToken);
    }
    // The below is for warming up kudu - is it really necessary? (RJ)
    getAppSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            var httpRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/settings`)
            };
            try {
                var response = yield this._client.beginRequest(httpRequest);
                if (response.statusCode !== 200)
                    throw response;
            }
            catch (error) {
                throw Error("Failed to fetch Kudu App Settings.\n" + this._getFormattedError(error));
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
                if (response.statusCode == 200) {
                    return null;
                }
                else if (response.statusCode == 202) {
                    let pollableURL = response.headers.location;
                    if (!!pollableURL) {
                        return yield this._getDeploymentDetailsFromPollURL(pollableURL);
                    }
                    else {
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
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to get deployment logs.\n" + this._getFormattedError(error));
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
                if (response.statusCode == 200) {
                    return response.body;
                }
                throw response;
            }
            catch (error) {
                throw Error("Failed to get deployment logs.\n" + this._getFormattedError(error));
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
                    if (result.status == 4 || result.status == 3) {
                        return result;
                    }
                    else {
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
