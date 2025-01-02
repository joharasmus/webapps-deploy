import * as core from '@actions/core';

import { AuthorizerFactory } from "azure-actions-webclient/AuthorizerFactory";
import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';

import { ActionParameters } from "./actionparameters";
import { DEPLOYMENT_PROVIDER_TYPES } from "./DeploymentProvider/Providers/BaseWebAppDeploymentProvider";
import { DeploymentProviderFactory } from './DeploymentProvider/DeploymentProviderFactory';
import { PublishProfileWebAppValidator } from './ActionInputValidator/ActionValidators/PublishProfileWebAppValidator';

export async function main() {
  let isDeploymentSuccess: boolean = true;

  try {
    // Initialize action inputs
    let endpoint: IAuthorizer = !!core.getInput('publish-profile') ? null : await AuthorizerFactory.getAuthorizer();
    ActionParameters.getActionParams(endpoint);

    let type = DEPLOYMENT_PROVIDER_TYPES.PUBLISHPROFILE;

    // Validate action inputs
    let validator = new PublishProfileWebAppValidator();
    await validator.validate();

    var deploymentProvider = DeploymentProviderFactory.getDeploymentProvider(type);

    core.debug("Predeployment Step Started");
    await deploymentProvider.PreDeploymentStep();

    core.debug("Deployment Step Started");
    await deploymentProvider.DeployWebAppStep();
  }
  catch(error) {
    isDeploymentSuccess = false;

    if (error.statusCode == 403) {
      core.setFailed("The deployment to your web app failed with HTTP status code 403. \
      Your web app may have networking features enabled which are blocking access (such as Private Endpoints). \
      For more information about deploying to virtual network integrated web apps, please follow https://aka.ms/gha/deploying-to-network-secured-sites");
    } else {
      core.setFailed("Deployment Failed, " + error);
    }
  }
  finally {
      if(deploymentProvider != null) {
          await deploymentProvider.UpdateDeploymentStatus(isDeploymentSuccess);
      }

      core.debug(isDeploymentSuccess ? "Deployment Succeeded" : "Deployment failed");
  }
}

main();