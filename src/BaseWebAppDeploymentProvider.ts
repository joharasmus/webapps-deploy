import * as core from '@actions/core';

import { ActionParameters } from './actionparameters';
import { PublishProfile } from './PublishProfile';

import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { addAnnotation } from 'azure-actions-appservice-rest/Utilities/AnnotationUtility';

export abstract class BaseWebAppDeploymentProvider {
    protected actionParams:ActionParameters;
    protected appService: AzureAppService;
    protected kuduService: Kudu;
    protected appServiceUtility: AzureAppServiceUtility;
    protected kuduServiceUtility: KuduServiceUtility;
    protected activeDeploymentID; 
    protected applicationURL: string;
    protected deploymentID: string;

    constructor() {
        this.actionParams = ActionParameters.getActionParams();
    }

    abstract DeployWebAppStep(): void;

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean) {
        if(!!this.appService) {
            await addAnnotation(this.actionParams.endpoint, this.appService, isDeploymentSuccess);
        }
        
        this.activeDeploymentID = await this.kuduServiceUtility.updateDeploymentStatus(isDeploymentSuccess, null, {'type': 'Deployment', slotName: "production"});
        core.debug('Active DeploymentId :'+ this.activeDeploymentID);

        if(!!isDeploymentSuccess && !!this.deploymentID && !!this.activeDeploymentID) {
            await this.kuduServiceUtility.postZipDeployOperation(this.deploymentID, this.activeDeploymentID);
        }
        
        console.log('App Service Application URL: ' + this.applicationURL);
    }

    public async initializeForPublishProfile() {
        const publishProfile: PublishProfile = PublishProfile.getPublishProfile(this.actionParams.publishProfileContent);
        
        this.kuduService = publishProfile.kuduService;
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);
        
        this.applicationURL = publishProfile.appUrl;
    }
}