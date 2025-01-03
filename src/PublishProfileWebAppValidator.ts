
import { ActionParameters } from "./actionparameters";
import { ScmCredentials, PublishProfile } from "./PublishProfile";
import { Package } from "azure-actions-utility/packageUtility";

export class PublishProfileWebAppValidator {
    
    async validate(): Promise<void> {

        validateAppDetails();

        await validatePackageInput();
    }
    
}

// Cross-validate provided app name is same as that in publish profile

export function validateAppDetails() {

    let actionParams: ActionParameters = ActionParameters.getActionParams();

    if (!!actionParams.appName) {
        let creds: ScmCredentials = PublishProfile.getPublishProfile(actionParams.publishProfileContent).creds;
        //for kubeapps in publishsettings file username doesn't start with $, for all other apps it starts with $
        let splitUsername: string[] = creds.username.startsWith("$") ? creds.username.toUpperCase().substring(1).split("__") : creds.username.toUpperCase().split("__");
        let appNameMatch: boolean = !actionParams.appName || actionParams.appName.toUpperCase() === splitUsername[0];
        if (!appNameMatch) {
            throw new Error("Publish profile is invalid for app-name. Provide correct publish profile credentials for app.");
        }
    }
}

// validate package input

export async function validatePackageInput() {
    let actionParams = ActionParameters.getActionParams();
    actionParams.package = new Package(actionParams.packageInput);

    // msbuild package deployment is not supported
    let isMSBuildPackage = await actionParams.package.isMSBuildPackage();
    if (isMSBuildPackage) {
        throw new Error(`Deployment of msBuild generated package is not supported. Please change package format.`);
    }
}

