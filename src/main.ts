import * as core from '@actions/core';

import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';

import { ActionParameters } from "./actionparameters";
import { DEPLOYMENT_PROVIDER_TYPES } from "./DeploymentProvider/BaseWebAppDeploymentProvider";
import { PublishProfileWebAppValidator } from './InputValidator/PublishProfileWebAppValidator';
import { WebAppDeploymentProvider } from './DeploymentProvider/WebAppDeploymentProvider';

export async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    // Initialize action inputs
    let endpoint: IAuthorizer = !!core.getInput('publish-profile') ? null : await AuthorizerFactory.getAuthorizer();
    ActionParameters.getActionParams(endpoint);

    // Validate action inputs
    let validator = new PublishProfileWebAppValidator();
    await validator.validate();
    
    let type = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;
    var deploymentProvider = new WebAppDeploymentProvider(type);

    core.debug("Predeployment Step Started");
    await deploymentProvider.PreDeploymentStep();

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