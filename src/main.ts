import * as core from '@actions/core';

import { ActionParameters } from "./actionparameters";
import { WebAppDeployer } from './WebAppDeployer';
import { Package } from 'azure-actions-utility/packageUtility';

export async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    // Initialize action inputs
    let actionParams = ActionParameters.getActionParams(null);
    actionParams.package = new Package(actionParams.packageInput);
    
    var deploymentProvider = new WebAppDeployer();

    await deploymentProvider.initializeForPublishProfile();
    await deploymentProvider.DeployWebAppStep();
  }
  catch(error) {
    isDeploymentSuccess = false;
    core.setFailed("Deployment Failed, " + error);
  }
}

main();