# Deployment of Azure Web Apps

This repository contains a GitHub Action for deployment to an Azure WebApp (Windows or Linux). The action supports deploying a folder or \**.zip* files (except msBuild generated packages).

You can also use this GitHub Action to deploy a customized image into an Azure WebApps container.

This project welcomes contributions and suggestions.

## First: a few reminders

* [Checkout](https://github.com/actions/checkout) your Git repository content into GitHub Actions agent.
* Authenticate using [Azure Web App Publish Profile](https://github.com/projectkudu/kudu/wiki/Deployment-credentials#site-credentials-aka-publish-profile-credentials) or the [Azure Login Action](https://github.com/Azure/login).
* Enable [Run from Package](https://docs.microsoft.com/en-us/azure/app-service/deploy-run-package#enable-running-from-package), otherwise remote build will take time and the deployment will take longer. 
* Use a setup action to install build tools in a specific language based environment (.NET/Java/Python etc.).
* To build and deploy a containerized app, use [docker-login](https://github.com/Azure/docker-login) to log in to a private container registry such as [Azure Container registry](https://azure.microsoft.com/services/container-registry/).
* Deployment of msBuild generated package is not supported.
* Workflow samples for various **runtime** environments are given at https://github.com/Azure/actions-workflow-samples/tree/master/AppService.

## How to configure deployment credentials

For any credentials like Publish Profile, add them as [secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions) in the GitHub repository and then use them in the workflow.

Follow these steps to configure the secret:

* Download the publish profile for the WebApp from the portal ("Get Publish profile")
* Define a new secret under your repository settings -> "Add secret"
* Paste the contents for the downloaded publish profile file into the secret's value field
* In the workflow file: fill in the field `publish-profile:` with your secret.
