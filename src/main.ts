import * as core from '@actions/core';

import { ActionParameters } from "./actionparameters";
import { WebAppValidator } from './WebAppValidator';
import { WebAppDeployer } from './WebAppDeployer';

export async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    // Initialize action inputs
    ActionParameters.getActionParams(null);

    // Validate action inputs
    let validator = new WebAppValidator();
    await validator.validate();
    
    var deploymentProvider = new WebAppDeployer();

    await deploymentProvider.initializeForPublishProfile();
    await deploymentProvider.DeployWebAppStep();
  }
  catch(error) {
    isDeploymentSuccess = false;
    core.setFailed("Deployment Failed, " + error);
  }
  finally {
      await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess);
  }
}

main();