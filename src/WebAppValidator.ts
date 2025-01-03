
import { ActionParameters } from "./actionparameters";
import { Package } from "azure-actions-utility/packageUtility";

export class WebAppValidator {
    
    async validate(): Promise<void> {
        await validatePackageInput();
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

