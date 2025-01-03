import * as core from '@actions/core';

import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';

import { ActionParameters } from "./actionparameters";
import { PublishProfileWebAppValidator } from './PublishProfileWebAppValidator';
import { WebAppDeploymentProvider } from './WebAppDeploymentProvider';

export async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    // Initialize action inputs
    let endpoint: IAuthorizer = null;
    ActionParameters.getActionParams(endpoint);

    // Validate action inputs
    let validator = new PublishProfileWebAppValidator();
    await validator.validate();
    
    var deploymentProvider = new WebAppDeploymentProvider();

    core.debug("Predeployment Step Started");
    await deploymentProvider.initializeForPublishProfile();

    core.debug("Deployment Step Started");
    await deploymentProvider.DeployWebAppStep();
  }
  catch(error) {
    isDeploymentSuccess = false;
    core.setFailed("Deployment Failed, " + error);
  }
  finally {
      await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess);

      core.debug(isDeploymentSuccess ? "Deployment Succeeded" : "Deployment failed");
  }
}

main();