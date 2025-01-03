import * as core from '@actions/core';
import { IAuthorizer } from "azure-actions-webclient/Authorizer/IAuthorizer";
import { Package } from 'azure-actions-utility/packageUtility';
const github = require('@actions/github');

export class ActionParameters {
    private static actionparams: ActionParameters;
    private _appName: string;
    private _packageInput: string;
    private _package: Package;
    private _endpoint: IAuthorizer;
    private _publishProfileContent: string;
    private _commitMessage: string;

    // Used only for OneDeploy
    private _type: string = "";

    private constructor(endpoint: IAuthorizer) {
        this._publishProfileContent = core.getInput('publish-profile');
        this._appName = core.getInput('app-name');
        this._packageInput = core.getInput('package');
        /**
         * Trimming the commit message because it is used as a param in uri of deployment api. And sometimes, it exceeds the max length of http URI.
         */
        this._commitMessage = github.context.eventName === 'push' ? github.context.payload.head_commit.message.slice(0, 1000) : "";
        this._endpoint = endpoint;
    }

    public static getActionParams(endpoint?: IAuthorizer) {
        if (!this.actionparams) {
            this.actionparams = new ActionParameters(!!endpoint ? endpoint : null);
        }
        return this.actionparams;
    }
    public get appName() {
        return this._appName;
    }
    public get commitMessage(){
        return this._commitMessage;
    }
    public set commitMessage(commitMessage: string) {
        this._commitMessage = commitMessage;
    }
    public get packageInput() {
        return this._packageInput;
    }

    public get package() {
        return this._package;
    }

    public set package(appPackage: Package) {
        this._package = appPackage;
    }

    public get endpoint() {
        return this._endpoint;
    }

    public get publishProfileContent() {
        return this._publishProfileContent;
    }

    public get type() {
        return this._type;
    }

    public set type(type:string) {
        this._type = type;
    }
}