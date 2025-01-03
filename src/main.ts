import * as core from '@actions/core';

import { Package } from 'azure-actions-utility/packageUtility';
import { SecretParser, FormatType } from 'actions-secret-parser';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';
import { KuduServiceUtility } from 'azure-actions-appservice-rest/Utilities/KuduServiceUtility';
import * as utility from 'azure-actions-utility/utility';
import * as zipUtility from 'azure-actions-utility/ziputility';

export async function main() {
  try {
    let publishProfileContent = core.getInput('publish-profile');
    let packageInput = core.getInput('package');
    let appPackage = new Package(packageInput);
    
    await WebAppDeployer.DeployWebApp(publishProfileContent, appPackage);
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}

export class WebAppDeployer {
  
  public static async DeployWebApp(publishProfileContent: string, appPackage: Package) {
    
    let secrets = new SecretParser(publishProfileContent, FormatType.XML);

    let uri = secrets.getSecret("//publishProfile/@publishUrl", false);
    uri = `https://${uri}`;
    let username = secrets.getSecret("//publishProfile/@userName", true);
    let password = secrets.getSecret("//publishProfile/@userPWD", true);
    
    let kuduService = new Kudu(uri, { username: username, password: password });
    let kuduServiceUtility = new KuduServiceUtility(kuduService);
    
    let webPackage = appPackage.getPath();
    
    await kuduServiceUtility.warmpUp();
    
    let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
    webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
    
    await kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage: "" },
      "", "zip", "true", "true");
  }
}
  
main();