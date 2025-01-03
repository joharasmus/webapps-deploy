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
exports.WebAppValidator = void 0;
exports.validatePackageInput = validatePackageInput;
const actionparameters_1 = require("./actionparameters");
const packageUtility_1 = require("azure-actions-utility/packageUtility");
class WebAppValidator {
    validate() {
        return __awaiter(this, void 0, void 0, function* () {
            yield validatePackageInput();
        });
    }
}
exports.WebAppValidator = WebAppValidator;
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
