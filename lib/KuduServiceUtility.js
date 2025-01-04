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
exports.KuduServiceUtility = void 0;
const Kudu_1 = require("./Kudu");
const core = __importStar(require("@actions/core"));
class KuduServiceUtility {
    constructor(kuduService) {
        this.webAppKuduService = kuduService;
    }
    getDeploymentID() {
        if (this._deploymentID) {
            return this._deploymentID;
        }
        var deploymentID = `${process.env.GITHUB_SHA}` + Date.now().toString();
        return deploymentID;
    }
    deployUsingOneDeploy(packagePath, customMessage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Package deployment using OneDeploy initiated.');
                let queryParameters = [
                    'async=true',
                    'deployer=GITHUB_ONE_DEPLOY',
                    'type=zip',
                    'clean=true',
                    'restart=true'
                ];
                var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
                queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
                let deploymentDetails = yield this.webAppKuduService.oneDeploy(packagePath, queryParameters);
                console.log(deploymentDetails);
                yield this._processDeploymentResponse(deploymentDetails);
                console.log('Successfully deployed web package to App Service.');
            }
            catch (error) {
                core.error('Failed to deploy web package to App Service.');
                throw error;
            }
        });
    }
    _processDeploymentResponse(deploymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                var kuduDeploymentDetails = yield this.webAppKuduService.getDeploymentDetails(deploymentDetails.id);
                core.debug(`logs from kudu deploy: ${kuduDeploymentDetails.log_url}`);
                if (deploymentDetails.status == Kudu_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                    yield this._printZipDeployLogs(kuduDeploymentDetails.log_url);
                }
                else {
                    console.log('Deploy logs can be viewed at %s', kuduDeploymentDetails.log_url);
                }
            }
            catch (error) {
                core.debug(`Unable to fetch logs for kudu Deploy: ${JSON.stringify(error)}`);
            }
            if (deploymentDetails.status == Kudu_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                throw 'Package deployment using ZIP Deploy failed. Refer logs for more details.';
            }
        });
    }
    _printZipDeployLogs(log_url) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!log_url) {
                return;
            }
            var deploymentLogs = yield this.webAppKuduService.getDeploymentLogs(log_url);
            for (var deploymentLog of deploymentLogs) {
                console.log(`${deploymentLog.message}`);
                if (deploymentLog.details_url) {
                    yield this._printZipDeployLogs(deploymentLog.details_url);
                }
            }
        });
    }
    _getUpdateHistoryRequest(isDeploymentSuccess, deploymentID, customMessage) {
        deploymentID = !!deploymentID ? deploymentID : this.getDeploymentID();
        var message = {
            type: "deployment",
            sha: `${process.env.GITHUB_SHA}`,
            repoName: `${process.env.GITHUB_REPOSITORY}`,
            actor: `${process.env.GITHUB_ACTOR}`
        };
        if (!!customMessage) {
            // Append Custom Messages to original message
            for (var attribute in customMessage) {
                message[attribute] = customMessage[attribute];
            }
        }
        var deploymentLogType = message['type'];
        var active = false;
        if (deploymentLogType.toLowerCase() === "deployment" && isDeploymentSuccess) {
            active = true;
        }
        return {
            id: deploymentID,
            active: active,
            status: isDeploymentSuccess ? Kudu_1.KUDU_DEPLOYMENT_CONSTANTS.SUCCESS : Kudu_1.KUDU_DEPLOYMENT_CONSTANTS.FAILED,
            message: JSON.stringify(message),
            author: `${process.env.GITHUB_ACTOR}`,
            deployer: 'GitHub'
        };
    }
}
exports.KuduServiceUtility = KuduServiceUtility;
