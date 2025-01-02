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
exports.containerInputsNotAllowed = containerInputsNotAllowed;
exports.validateAppDetails = validateAppDetails;
exports.startupCommandNotAllowed = startupCommandNotAllowed;
exports.validatePackageInput = validatePackageInput;
const packageUtility_1 = require("azure-actions-utility/packageUtility");
const PublishProfile_1 = require("../PublishProfile");
const actionparameters_1 = require("../actionparameters");
// Error if image info is provided
function containerInputsNotAllowed(images, configFile, isPublishProfile = false) {
    if (!!images || !!configFile) {
        throw new Error(`This is not a container web app. Please remove inputs like images and configuration-file which are only relevant for container deployment.`);
    }
}
// Cross-validate provided app name and slot is same as that in publish profile
function validateAppDetails() {
    let actionParams = actionparameters_1.ActionParameters.getActionParams();
    if (!!actionParams.appName || (!!actionParams.slotName && actionParams.slotName.toLowerCase() !== 'production')) {
        let creds = PublishProfile_1.PublishProfile.getPublishProfile(actionParams.publishProfileContent).creds;
        //for kubeapps in publishsettings file username doesn't start with $, for all other apps it starts with $
        let splitUsername = creds.username.startsWith("$") ? creds.username.toUpperCase().substring(1).split("__") : creds.username.toUpperCase().split("__");
        let appNameMatch = !actionParams.appName || actionParams.appName.toUpperCase() === splitUsername[0];
        let slotNameMatch = actionParams.slotName.toLowerCase() === 'production' || actionParams.slotName.toUpperCase() === splitUsername[1];
        if (!appNameMatch || !slotNameMatch) {
            throw new Error("Publish profile is invalid for app-name and slot-name provided. Provide correct publish profile credentials for app.");
        }
    }
}
// Error is startup command is provided
function startupCommandNotAllowed(startupCommand) {
    if (!!startupCommand) {
        throw new Error("startup-command is not a valid input for Windows web app or with publish-profile auth scheme.");
    }
}
// validate package input
function validatePackageInput() {
    return __awaiter(this, void 0, void 0, function* () {
        let actionParams = actionparameters_1.ActionParameters.getActionParams();
        actionParams.package = new packageUtility_1.Package(actionParams.packageInput);
        // msbuild package deployment is not supported
        let isMSBuildPackage = yield actionParams.package.isMSBuildPackage();
        if (isMSBuildPackage) {
            throw new Error(`Deployment of msBuild generated package is not supported. Please change package format.`);
        }
    });
}
