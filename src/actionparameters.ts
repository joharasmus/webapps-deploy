import * as core from '@actions/core';
import { Package } from 'azure-actions-utility/packageUtility';

export class ActionParameters {
    public package: Package;
    public publishProfileContent: string;

    public constructor() {
        this.publishProfileContent = core.getInput('publish-profile');
        let packageInput = core.getInput('package');
        this.package = new Package(packageInput);
    }
}