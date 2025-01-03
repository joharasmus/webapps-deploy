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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionParameters = void 0;
const core = __importStar(require("@actions/core"));
const github = require('@actions/github');
class ActionParameters {
    constructor(endpoint) {
        // Used only for OneDeploy
        this._type = "";
        this._publishProfileContent = core.getInput('publish-profile');
        this._appName = core.getInput('app-name');
        this._packageInput = core.getInput('package');
        /**
         * Trimming the commit message because it is used as a param in uri of deployment api. And sometimes, it exceeds the max length of http URI.
         */
        this._commitMessage = github.context.eventName === 'push' ? github.context.payload.head_commit.message.slice(0, 1000) : "";
        this._endpoint = endpoint;
    }
    static getActionParams(endpoint) {
        if (!this.actionparams) {
            this.actionparams = new ActionParameters(!!endpoint ? endpoint : null);
        }
        return this.actionparams;
    }
    get appName() {
        return this._appName;
    }
    get commitMessage() {
        return this._commitMessage;
    }
    set commitMessage(commitMessage) {
        this._commitMessage = commitMessage;
    }
    get packageInput() {
        return this._packageInput;
    }
    get package() {
        return this._package;
    }
    set package(appPackage) {
        this._package = appPackage;
    }
    get endpoint() {
        return this._endpoint;
    }
    get publishProfileContent() {
        return this._publishProfileContent;
    }
    get type() {
        return this._type;
    }
    set type(type) {
        this._type = type;
    }
}
exports.ActionParameters = ActionParameters;
