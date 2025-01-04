import * as core from '@actions/core';
import * as fs from 'fs';

import { KuduServiceClient } from './KuduServiceClient';
import { WebRequest, WebRequestOptions } from 'azure-actions-webclient/WebClient';


export const KUDU_DEPLOYMENT_CONSTANTS = {
    SUCCESS: 4,
    FAILED: 3
}

export class Kudu {
    private _client: KuduServiceClient;

    constructor(scmUri: string, credentials: {username: string, password: string} | string) {
        const accessToken = typeof credentials === 'string'
            ? credentials
            : (new Buffer(credentials.username + ':' + credentials.password).toString('base64'));
        const accessTokenType = typeof credentials === 'string' ? "Bearer" : "Basic"

        this._client = new KuduServiceClient(scmUri, accessToken, accessTokenType);
    }

    public async updateDeployment(requestBody: any): Promise<string> {
        var httpRequest: WebRequest = {
            method: 'PUT',
            body: JSON.stringify(requestBody),
            uri: this._client.getRequestUri(`/api/deployments/${requestBody.id}`)
        };

        try {
            let webRequestOptions: WebRequestOptions = {retriableErrorCodes: [], retriableStatusCodes: null, retryCount: 5, retryIntervalInSeconds: 5, retryRequestTimedout: true};
            var response = await this._client.beginRequest(httpRequest, webRequestOptions);
            core.debug(`updateDeployment. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                console.log("Successfully updated deployment History at " + response.body.url);
                return response.body.id;
            }

            throw response;
        }
        catch(error) {
            throw Error("Failed to update deployment history.\n" + this._getFormattedError(error));
        }
    }

    public async getAppSettings(): Promise<Map<string, string>> {
        var httpRequest: WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri(`/api/settings`)
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            var responseBody = JSON.stringify(response.body);
            var appSettingsMap = JSON.parse(responseBody);

            core.debug(`App settings: ${Object.keys(appSettingsMap)}`);

            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error("Failed to fetch Kudu App Settings.\n" + this._getFormattedError(error));
        }
    }

    public async oneDeploy(webPackage: string, queryParameters?: Array<string>): Promise<any> {
        let httpRequest: WebRequest = {
            method: 'POST',
            uri: this._client.getRequestUri(`/api/publish`, queryParameters),
            body: fs.createReadStream(webPackage)
        };

        try {
            let response = await this._client.beginRequest(httpRequest, null, 'application/octet-stream');
            core.debug(`One Deploy response: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                core.debug('Deployment passed');
                return null;
            }
            else if (response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if (!!pollableURL) {
                    core.debug(`Polling for One Deploy URL: ${pollableURL}`);
                    return await this._getDeploymentDetailsFromPollURL(pollableURL);
                }
                else {
                    core.debug('One Deploy returned 202 without pollable URL.');
                    return null;
                }
            }
            else {
                throw response;
            }
        }
        catch (error) {
            throw Error("Failed to deploy web package using OneDeploy to App Service.\n" + this._getFormattedError(error));
        }
    }


    public async getDeploymentDetails(deploymentID: string): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`/api/deployments/${deploymentID}`)
            };
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`getDeploymentDetails. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error("Failed to gte deployment logs.\n" + this._getFormattedError(error));
        }
    }

    public async getDeploymentLogs(log_url: string): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: log_url
            };
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`getDeploymentLogs. Data: ${JSON.stringify(response)}`);
            if(response.statusCode == 200) {
                return response.body;
            }

            throw response;
        }
        catch(error) {
            throw Error("Failed to gte deployment logs.\n" + this._getFormattedError(error));
        }
    }

    private async _getDeploymentDetailsFromPollURL(pollURL: string):Promise<any> {
        let httpRequest: WebRequest = {
            method: 'GET',
            uri: pollURL,
            headers: {}
        };

        while(true) {
            let response = await this._client.beginRequest(httpRequest);
            if(response.statusCode == 200 || response.statusCode == 202) {
                var result = response.body;
                core.debug(`POLL URL RESULT: ${JSON.stringify(response)}`);
                if(result.status == KUDU_DEPLOYMENT_CONSTANTS.SUCCESS || result.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                    return result;
                }
                else {
                    core.debug(`Deployment status: ${result.status} '${result.status_text}'. retry after 5 seconds`);
                    await this._sleep(5);
                    continue;
                }
            }
            else {
                throw response;
            }
        }
    }

    private _getFormattedError(error: any) {
        if(error && error.statusCode) {
            return `${error.statusMessage} (CODE: ${error.statusCode})`;
        }
        else if(error && error.message) {
            if(error.statusCode) {
                error.message = `${typeof error.message.valueOf() == 'string' ? error.message : error.message.Code + " - " + error.message.Message } (CODE: ${error.statusCode})`
            }

            return error.message;
        }

        return error;
    }

    private _sleep(sleepDurationInSeconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
}