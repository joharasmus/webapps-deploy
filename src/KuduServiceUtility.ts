import { KUDU_DEPLOYMENT_CONSTANTS } from './Kudu';
import { Kudu } from './Kudu';
import * as core from '@actions/core';

const GITHUB_ONE_DEPLOY: string = 'GITHUB_ONE_DEPLOY';

export class KuduServiceUtility {
    public webAppKuduService: Kudu;
    private _deploymentID: string;

    constructor(kuduService: Kudu) {
        this.webAppKuduService = kuduService;
    }

    public getDeploymentID(): string {
        if(this._deploymentID) {
            return this._deploymentID;
        }

        var deploymentID: string = `${process.env.GITHUB_SHA}` + Date.now().toString();
        return deploymentID;
    }

    public async deployUsingOneDeploy(packagePath: string, customMessage?: any, targetPath?: any, type?: any, clean?: any, restart?: any): Promise<string> {
        try {
            console.log('Package deployment using OneDeploy initiated.');
            let queryParameters: Array<string> = [
                'async=true',
                'deployer=' + GITHUB_ONE_DEPLOY
            ];

            if (type) {
                queryParameters.push('type=' + encodeURIComponent(type));
            }

            if (targetPath) {
                queryParameters.push('path=' + encodeURIComponent(targetPath));
            }

            if (clean) {
                queryParameters.push('clean=' + encodeURIComponent(clean));
            }

            if (restart) {
                queryParameters.push('restart=' + encodeURIComponent(restart));
            }

            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this.webAppKuduService.oneDeploy(packagePath, queryParameters);
            console.log(deploymentDetails);
            await this._processDeploymentResponse(deploymentDetails);
            console.log('Successfully deployed web package to App Service.');

            return deploymentDetails.id;
        }
        catch (error) {
            core.error('Failed to deploy web package to App Service.');
            throw error;
        }
    }

    private async _processDeploymentResponse(deploymentDetails: any): Promise<void> {
        try {
            var kuduDeploymentDetails = await this.webAppKuduService.getDeploymentDetails(deploymentDetails.id);
            core.debug(`logs from kudu deploy: ${kuduDeploymentDetails.log_url}`);

            if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                await this._printZipDeployLogs(kuduDeploymentDetails.log_url);
            }
            else {
                console.log('Deploy logs can be viewed at %s', kuduDeploymentDetails.log_url);
            }
        }
        catch(error) {
            core.debug(`Unable to fetch logs for kudu Deploy: ${JSON.stringify(error)}`);
        }

        if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
            throw 'Package deployment using ZIP Deploy failed. Refer logs for more details.';
        }
    }

    private async _printZipDeployLogs(log_url: string): Promise<void> {
        if(!log_url) {
            return;
        }

        var deploymentLogs = await this.webAppKuduService.getDeploymentLogs(log_url);
        for(var deploymentLog of deploymentLogs) {
            console.log(`${deploymentLog.message}`);
            if(deploymentLog.details_url) {
                await this._printZipDeployLogs(deploymentLog.details_url);
            }
        }
    }

    private _getUpdateHistoryRequest(isDeploymentSuccess: boolean, deploymentID?: string, customMessage?: any): any {    
        deploymentID = !!deploymentID ? deploymentID : this.getDeploymentID();
        
        var message = {
            type : "deployment",
            sha : `${process.env.GITHUB_SHA}`,
            repoName : `${process.env.GITHUB_REPOSITORY}`,
            actor: `${process.env.GITHUB_ACTOR}`
        };

        if(!!customMessage) {
            // Append Custom Messages to original message
            for(var attribute in customMessage) {
                message[attribute] = customMessage[attribute];
            }
            
        }
        var deploymentLogType: string = message['type'];
        var active: boolean = false;
        if(deploymentLogType.toLowerCase() === "deployment" && isDeploymentSuccess) {
            active = true;
        }

        return {
            id: deploymentID,
            active : active,
            status : isDeploymentSuccess ? KUDU_DEPLOYMENT_CONSTANTS.SUCCESS : KUDU_DEPLOYMENT_CONSTANTS.FAILED,
            message : JSON.stringify(message),
            author : `${process.env.GITHUB_ACTOR}`,
            deployer : 'GitHub'
        };
    }
}