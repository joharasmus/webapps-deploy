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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.WebAppDeployer = void 0;
const core = __importStar(require("@actions/core"));
const utility = __importStar(require("azure-actions-utility/utility.js"));
const zipUtility = __importStar(require("azure-actions-utility/ziputility.js"));
const AnnotationUtility_1 = require("azure-actions-appservice-rest/Utilities/AnnotationUtility");
const actionparameters_1 = require("./actionparameters");
const KuduServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/KuduServiceUtility");
const PublishProfile_1 = require("./PublishProfile");
class WebAppDeployer {
    constructor() {
        this.actionParams = actionparameters_1.ActionParameters.getActionParams();
    }
    DeployWebAppStep() {
        return __awaiter(this, void 0, void 0, function* () {
            let appPackage = this.actionParams.package;
            let webPackage = appPackage.getPath();
            // kudu warm up
            yield this.kuduServiceUtility.warmpUp();
            let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
            webPackage = (yield zipUtility.archiveFolder(webPackage, "", tempPackagePath));
            core.debug("Compressed folder into zip " + webPackage);
            core.debug("Initiated deployment via kudu service for webapp package : " + webPackage);
            this.deploymentID = yield this.kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage: this.actionParams.commitMessage }, "", "zip", "true", "true");
        });
    }
    UpdateDeploymentStatus(isDeploymentSuccess) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!!this.appService) {
                yield (0, AnnotationUtility_1.addAnnotation)(this.actionParams.endpoint, this.appService, isDeploymentSuccess);
            }
            console.log('App Service Application URL: ' + this.applicationURL);
        });
    }
    initializeForPublishProfile() {
        return __awaiter(this, void 0, void 0, function* () {
            const publishProfile = PublishProfile_1.PublishProfile.getPublishProfile(this.actionParams.publishProfileContent);
            this.kuduService = publishProfile.kuduService;
            this.kuduServiceUtility = new KuduServiceUtility_1.KuduServiceUtility(this.kuduService);
            this.applicationURL = publishProfile.appUrl;
        });
    }
}
exports.WebAppDeployer = WebAppDeployer;
