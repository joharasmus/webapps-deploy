import * as utility from 'azure-actions-utility/utility.js';
import * as zipUtility from 'azure-actions-utility/ziputility.js';

import { addAnnotation } from 'azure-actions-appservice-rest/Utilities/AnnotationUtility';
import { ActionParameters } from './actionparameters';
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { Package } from "azure-actions-utility/packageUtility";
import { PublishProfile } from './PublishProfile';

export class WebAppDeployer {

    protected actionParams:ActionParameters;
    protected appService: AzureAppService;
    protected kuduService: Kudu;
    protected appServiceUtility: AzureAppServiceUtility;
    protected kuduServiceUtility: KuduServiceUtility;
    protected activeDeploymentID: string; 
    protected applicationURL: string;
    protected deploymentID: string;

    constructor() {
        this.actionParams = ActionParameters.getActionParams();
    }

    public async DeployWebAppStep() {
        let appPackage: Package = this.actionParams.package;
        let webPackage = appPackage.getPath();

        // kudu warm up
        await this.kuduServiceUtility.warmpUp(); 

        let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
        webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;

        this.deploymentID = await this.kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage:"" }, 
            "", "zip", "true", "true");
    }

    public async UpdateDeploymentStatus(isDeploymentSuccess: boolean) {
        if(!!this.appService) {
            await addAnnotation(this.actionParams.endpoint, this.appService, isDeploymentSuccess);
        }
    }

    public async initializeForPublishProfile() {
        const publishProfile: PublishProfile = PublishProfile.getPublishProfile(this.actionParams.publishProfileContent);
        
        this.kuduService = publishProfile.kuduService;
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);
        
        this.applicationURL = publishProfile.appUrl;
    }
}