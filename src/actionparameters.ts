import * as core from '@actions/core';
import { Package } from 'azure-actions-utility/packageUtility';

export class ActionParameters {
    private static actionparams: ActionParameters;
    private _packageInput: string;
    private _package: Package;
    private _publishProfileContent: string;

    private constructor() {
        this._publishProfileContent = core.getInput('publish-profile');
        this._packageInput = core.getInput('package');
    }

    public static getActionParams() {
        if (!this.actionparams) {
            this.actionparams = new ActionParameters();
        }
        return this.actionparams;
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

    public get publishProfileContent() {
        return this._publishProfileContent;
    }
}