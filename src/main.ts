import * as core from '@actions/core';

import { ActionParameters } from "./actionparameters";
import { WebAppDeployer } from './WebAppDeployer';

export async function main() {
  try {
    // Initialize action inputs
    let actionParams = new ActionParameters();
    
    var deploymentProvider = new WebAppDeployer(actionParams);
    await deploymentProvider.DeployWebApp();
  }
  catch(error) {
    core.setFailed("Deployment Failed, " + error);
  }
}

main();