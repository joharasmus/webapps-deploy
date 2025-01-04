import * as fs from 'fs';

import { KuduServiceClient } from './KuduServiceClient';
import { WebRequest } from 'azure-actions-webclient/WebClient';


export class Kudu {
    private _client: KuduServiceClient;

    constructor(scmUri: string, username: string, password: string) {
        const accessToken = Buffer.from(username + ':' + password).toString('base64');

        this._client = new KuduServiceClient(scmUri, accessToken);
    }

    // The below is for warming up kudu - is it really necessary? (RJ)
    public async getAppSettings(): Promise<void> {
        var httpRequest: WebRequest = {
            method: 'GET',
            uri: this._client.getRequestUri(`/api/settings`)
        };

        try {
            var response = await this._client.beginRequest(httpRequest);

            if(response.statusCode !== 200)
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

            if (response.statusCode == 200) {

                return null;
            }
            else if (response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if (!!pollableURL) {
                    return await this._getDeploymentDetailsFromPollURL(pollableURL);
                }
                else {
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

                if(result.status == 4 || result.status == 3) {
                    return result;
                }
                else {
                    await new Promise(() => setTimeout(null, 2000) );
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
        
        if(error && error.message) {
            return error.message;
        }

        return error;
    }
}