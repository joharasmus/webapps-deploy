
import { ActionParameters } from "./actionparameters";
import { ScmCredentials, PublishProfile } from "./PublishProfile";
import { Package } from "azure-actions-utility/packageUtility";

export class PublishProfileWebAppValidator {
    
    async validate(): Promise<void> {

        let actionParams: ActionParameters = ActionParameters.getActionParams();
        
        containerInputsNotAllowed(actionParams.images);

        validateAppDetails();

        startupCommandNotAllowed(actionParams.startupCommand);

        await validatePackageInput();
    }
    
}

// Error if image info is provided

export function containerInputsNotAllowed(images: string) {
    if (!!images) {
        throw new Error(`This is not a container web app. Please remove inputs like images which are only relevant for container deployment.`);
    }
}

// Cross-validate provided app name and slot is same as that in publish profile

export function validateAppDetails() {

    let actionParams: ActionParameters = ActionParameters.getActionParams();

    if (!!actionParams.appName || (!!actionParams.slotName && actionParams.slotName.toLowerCase() !== 'production')) {
        let creds: ScmCredentials = PublishProfile.getPublishProfile(actionParams.publishProfileContent).creds;
        //for kubeapps in publishsettings file username doesn't start with $, for all other apps it starts with $
        let splitUsername: string[] = creds.username.startsWith("$") ? creds.username.toUpperCase().substring(1).split("__") : creds.username.toUpperCase().split("__");
        let appNameMatch: boolean = !actionParams.appName || actionParams.appName.toUpperCase() === splitUsername[0];
        let slotNameMatch: boolean = actionParams.slotName.toLowerCase() === 'production' || actionParams.slotName.toUpperCase() === splitUsername[1];
        if (!appNameMatch || !slotNameMatch) {
            throw new Error("Publish profile is invalid for app-name and slot-name provided. Provide correct publish profile credentials for app.");
        }
    }
}

// Error is startup command is provided

export function startupCommandNotAllowed(startupCommand: string) {
    if (!!startupCommand) {
        throw new Error("startup-command is not a valid input for Windows web app or with publish-profile auth scheme.");
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

