import * as core from '@actions/core';
import * as utility from 'azure-actions-utility/utility.js';
import * as zipUtility from 'azure-actions-utility/ziputility.js';

import { Package } from "azure-actions-utility/packageUtility";

import { BaseWebAppDeploymentProvider } from './BaseWebAppDeploymentProvider';
import { addAnnotation } from 'azure-actions-appservice-rest/Utilities/AnnotationUtility';

export class WebAppDeploymentProvider extends BaseWebAppDeploymentProvider {

    public async DeployWebAppStep() {
        let appPackage: Package = this.actionParams.package;
        let webPackage = appPackage.getPath();

        // kudu warm up
        await this.kuduServiceUtility.warmpUp(); 

        let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
        webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
        core.debug("Compressed folder into zip " +  webPackage);
        core.debug("Initiated deployment via kudu service for webapp package : "+ webPackage);
        
        this.deploymentID = await this.kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage:this.actionParams.commitMessage }, 
            "", "zip", "true", "true");
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean) {
        if(!!this.appService) {
            await addAnnotation(this.actionParams.endpoint, this.appService, isDeploymentSuccess);
        }
        
        console.log('App Service Application URL: ' + this.applicationURL);
    }
}