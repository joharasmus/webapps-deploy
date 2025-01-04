import { KUDU_DEPLOYMENT_CONSTANTS } from './Kudu';
import { Kudu } from './Kudu';
import * as core from '@actions/core';

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

    public async deployUsingOneDeploy(packagePath: string, customMessage?: any): Promise<void> {
        try {
            console.log('Package deployment using OneDeploy initiated.');
            let queryParameters: Array<string> = [
                'async=true',
                'deployer=GITHUB_ONE_DEPLOY',
                'type=zip',
                'clean=true',
                'restart=true'
            ];

            var deploymentMessage = this._getUpdateHistoryRequest(customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this.webAppKuduService.oneDeploy(packagePath, queryParameters);
            console.log(deploymentDetails);
            await this._processDeploymentResponse(deploymentDetails);
            console.log('Successfully deployed web package to App Service.');
        }
        catch (error) {
            core.error('Failed to deploy web package to App Service.');
            throw error;
        }
    }

    private async _processDeploymentResponse(deploymentDetails: any): Promise<void> {
        var kuduDeploymentDetails = await this.webAppKuduService.getDeploymentDetails(deploymentDetails.id);
        
        if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {

            var deploymentLogs = await this.webAppKuduService.getDeploymentLogs(kuduDeploymentDetails.log_url);
            for(var deploymentLog of deploymentLogs) {
                console.log(`${deploymentLog.message}`);
            }

            throw 'Package deployment using ZIP Deploy failed. Refer logs for more details.';
        }
    }

    private _getUpdateHistoryRequest(customMessage?: any): any {    
        let deploymentID = this.getDeploymentID();
        let isDeploymentSuccess = null;
        
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