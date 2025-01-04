import * as core from '@actions/core';
import * as utility from 'azure-actions-utility/utility';
import * as zipUtility from 'azure-actions-utility/ziputility';

import { Document, DOMParser } from '@xmldom/xmldom';
import { Package } from 'azure-actions-utility/packageUtility';
import { Kudu } from './Kudu';
import { KuduServiceUtility } from './KuduServiceUtility';

var xPathSelect = require('xpath').select;

export async function main() {
  try {
    let publishProfileContent = core.getInput('publish-profile');
    let packageInput = core.getInput('package');

    let appPackage = new Package(packageInput);
    
    let dom: Document = new DOMParser().parseFromString(publishProfileContent, "application/xml");
    
    let uri = xPathSelect("string(//publishProfile/@publishUrl)", dom, true);
    uri = `https://${uri}`;

    let username = xPathSelect("string(//publishProfile/@userName)", dom, true);
    core.setSecret(username);

    let password = xPathSelect("string(//publishProfile/@userPWD)", dom, true)
    core.setSecret(password);
    
    let kuduService = new Kudu(uri, username, password);
    await kuduService.getAppSettings();
    let kuduServiceUtility = new KuduServiceUtility(kuduService);

    let webPackage = appPackage.getPath();
    let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
    webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
    
    await kuduServiceUtility.deployUsingOneDeploy(webPackage, { slotName: "production", commitMessage: "" },
      "", "zip", "true", "true");
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}
  
main();