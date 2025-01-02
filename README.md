# For deployment of Azure Web Apps

With this GitHub Action, you can automate the deployment of [Azure Web Apps](https://azure.microsoft.com/services/app-service/web/) or [Azure Web Apps for Containers](https://azure.microsoft.com/services/app-service/containers/).

This repository contains GitHub Action for Azure WebApp to deploy to an Azure WebApp (Windows or Linux). The action supports deploying a folder, *\*.jar*, *\*.war*, and \**.zip* files (except msBuild generated packages).

You can also use this GitHub Action to deploy a customized image into an Azure WebApps container.

## First: a few reminders

* [Checkout](https://github.com/actions/checkout) your Git repository content into GitHub Actions agent.
* Authenticate using [Azure Web App Publish Profile](https://github.com/projectkudu/kudu/wiki/Deployment-credentials#site-credentials-aka-publish-profile-credentials) or the [Azure Login Action](https://github.com/Azure/login).
* This action does not support multi-container scenario with publish profile.
* If using [Azure Login](https://github.com/Azure/login), ensure you set appropriate values for the `environment` parameter.
* Enable [Run from Package](https://docs.microsoft.com/en-us/azure/app-service/deploy-run-package#enable-running-from-package), otherwise remote build will take time and the deployment will take longer. 
* Use a setup action to install build tools in a specific language based environment (.NET/Java/Python etc.).
* To build and deploy a containerized app, use [docker-login](https://github.com/Azure/docker-login) to log in to a private container registry such as [Azure Container registry](https://azure.microsoft.com/services/container-registry/).
* Workflow samples for various **runtime** environments are given at https://github.com/Azure/actions-workflow-samples/tree/master/AppService.
* In the workflow file: change `app-name` to your Web app name.


## Configure deployment credentials

For any credentials like Publish Profile, add them as [secrets](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets) in the GitHub repository and then use them in the workflow.

Follow the steps to configure the secret:

* *Note: As of October 2020, Linux web apps will need the app setting `WEBSITE_WEBDEPLOY_USE_SCM` set to `true` before continuing with next step of downloading the publish profile.*
* Download the publish profile for the WebApp from the portal ("Get Publish profile")
* Define a new secret under your repository settings -> "Add secret"
* Paste the contents for the downloaded publish profile file into the secret's value field
* In the workflow file: fill in the field `publish-profile:` with your secret.

This project welcomes contributions and suggestions.
