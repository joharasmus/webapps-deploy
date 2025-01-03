import * as utility from 'azure-actions-utility/utility.js';
import * as zipUtility from 'azure-actions-utility/ziputility.js';

import { ActionParameters } from './actionparameters';
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { Package } from "azure-actions-utility/packageUtility";
import { PublishProfile } from './PublishProfile';

export class WebAppDeployer {

    protected actionParams: ActionParameters;
    protected appService: AzureAppService;
    protected kuduService: Kudu;
    protected kuduServiceUtility: KuduServiceUtility;

    constructor(actionParams: ActionParameters) {
        this.actionParams = actionParams;
    }

    public async DeployWebApp() {
        const publishProfile = new PublishProfile(this.actionParams.publishProfileContent);
        
        this.kuduService = publishProfile.kuduService;
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);

        let appPackage: Package = this.actionParams.package;
        let webPackage = appPackage.getPath();

        await this.kuduServiceUtility.warmpUp(); 

        let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
        webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;

        await this.kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage:"" }, 
            "", "zip", "true", "true");
    }
}