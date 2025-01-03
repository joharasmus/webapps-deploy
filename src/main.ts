import * as core from '@actions/core';

import { WebAppDeployer } from './WebAppDeployer';
import { Package } from 'azure-actions-utility/packageUtility';

export async function main() {
  try {
    let publishProfileContent = core.getInput('publish-profile');
    let packageInput = core.getInput('package');
    let appPackage = new Package(packageInput);
    
    let deploymentProvider = new WebAppDeployer(publishProfileContent, appPackage);
    await deploymentProvider.DeployWebApp();
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}

main();
