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
exports.main = main;
const core = __importStar(require("@actions/core"));
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const azure_app_kudu_service_1 = require("azure-actions-appservice-rest/Kudu/azure-app-kudu-service");
const KuduServiceUtility_1 = require("azure-actions-appservice-rest/Utilities/KuduServiceUtility");
const utility = __importStar(require("azure-actions-utility/utility"));
const zipUtility = __importStar(require("azure-actions-utility/ziputility"));
const secretParser_1 = require("./secretParser");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let publishProfileContent = core.getInput('publish-profile');
            let packageInput = core.getInput('package');
            let appPackage = new packageUtility_1.Package(packageInput);
            let secrets = new secretParser_1.SecretParser(publishProfileContent);
            let uri = secrets.getSecret("//publishProfile/@publishUrl", false);
            uri = `https://${uri}`;
            let username = secrets.getSecret("//publishProfile/@userName", true);
            let password = secrets.getSecret("//publishProfile/@userPWD", true);
            let kuduService = new azure_app_kudu_service_1.Kudu(uri, { username, password });
            let kuduServiceUtility = new KuduServiceUtility_1.KuduServiceUtility(kuduService);
            yield kuduServiceUtility.warmpUp();
            let webPackage = appPackage.getPath();
            let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
            webPackage = (yield zipUtility.archiveFolder(webPackage, "", tempPackagePath));
            yield kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage: "" }, "", "zip", "true", "true");
        }
        catch (error) {
            core.setFailed("Deployment Failed, " + error);
        }
    });
}
main();
