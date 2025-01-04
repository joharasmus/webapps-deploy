import * as core from '@actions/core';
import * as utility from 'azure-actions-utility/utility';
import * as zipUtility from 'azure-actions-utility/ziputility';

import { Document, DOMParser } from '@xmldom/xmldom';
import { Package } from 'azure-actions-utility/packageUtility';
import { Kudu } from './Kudu';

var xPathSelect = require('xpath').select;

export async function deployUsingOneDeploy(packagePath: string, kuduService: Kudu): Promise<void> {
  try {
    console.log('Package deployment using OneDeploy initiated.');
    
    let queryParameters: Array<string> = [
      'async=true',
      'deployer=GITHUB_ONE_DEPLOY',
      'type=zip',
      'clean=true',
      'restart=true'
    ];
    
    let message = {
      type: "deployment",
      sha: `${process.env.GITHUB_SHA}`,
      repoName: `${process.env.GITHUB_REPOSITORY}`,
      actor: `${process.env.GITHUB_ACTOR}`,
      slotName: "production"
    };
    
    let deploymentMessage = JSON.stringify(message);
    queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
    
    let deploymentDetails = await kuduService.oneDeploy(packagePath, queryParameters);
    console.log(deploymentDetails);
    
    if (deploymentDetails.status == 3) {
      throw 'Package deployment using ZIP Deploy failed. Refer logs for more details.';
    }
    
    console.log('Successfully deployed web package to App Service.');
  }
  catch (error) {
    core.error('Failed to deploy web package to App Service.');
    throw error;
  }
}

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

    let webPackage = appPackage.getPath();
    let tempPackagePath = utility.generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
    webPackage = await zipUtility.archiveFolder(webPackage, "", tempPackagePath) as string;
    
    await deployUsingOneDeploy(webPackage, kuduService);
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}

main();