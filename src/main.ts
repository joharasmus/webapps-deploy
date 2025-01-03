import * as core from '@actions/core';

import { ActionParameters } from "./actionparameters";
import { WebAppDeployer } from './WebAppDeployer';
import { Package } from 'azure-actions-utility/packageUtility';

export async function main() {
  try {
    // Initialize action inputs
    let actionParams = ActionParameters.getActionParams();
    actionParams.package = new Package(actionParams.packageInput);
    
    var deploymentProvider = new WebAppDeployer(actionParams);
    await deploymentProvider.DeployWebApp();
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}

main();