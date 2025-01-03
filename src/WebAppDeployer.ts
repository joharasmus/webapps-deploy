import * as utility from 'azure-actions-utility/utility.js';
import * as zipUtility from 'azure-actions-utility/ziputility.js';

import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import { Package } from "azure-actions-utility/packageUtility";
import { SecretParser, FormatType } from 'actions-secret-parser';

export class WebAppDeployer {

    protected appService: AzureAppService;
    protected kuduService: Kudu;
    protected kuduServiceUtility: KuduServiceUtility;
    protected publishProfileContent: string;
    protected appPackage: Package;

    constructor(publishProfileContent: string, appPackage: Package) {
        this.publishProfileContent = publishProfileContent;
        this.appPackage = appPackage;
    }

    public async DeployWebApp() {
        
        this.MakeKudu(this.publishProfileContent);
        this.kuduServiceUtility = new KuduServiceUtility(this.kuduService);

        let appPackage: Package = this.appPackage;
        let webPackage = appPackage.getPath();

        await this.kuduServiceUtility.warmpUp(); 

        let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
        webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;

        await this.kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage:"" }, 
            "", "zip", "true", "true");
    }

    public MakeKudu(publishProfileContent: string) {
        let secrets = new SecretParser(publishProfileContent, FormatType.XML);
        let uri = secrets.getSecret("//publishProfile/@publishUrl", false);
        uri = `https://${uri}`;
        let username = secrets.getSecret("//publishProfile/@userName", true);
        let password = secrets.getSecret("//publishProfile/@userPWD", true);
    
        this.kuduService = new Kudu(uri, { username: username, password: password });
    }
}
