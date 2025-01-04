import * as fs from 'fs';

import { KuduServiceClient } from './KuduServiceClient';
import { WebRequest } from 'azure-actions-webclient/WebClient';


export class Kudu {
    private _client: KuduServiceClient;

    constructor(scmUri: string, username: string, password: string) {
        const accessToken = Buffer.from(username + ':' + password).toString('base64');

        this._client = new KuduServiceClient(scmUri, accessToken);
    }

    public async oneDeploy(webPackage: string, queryParameters?: Array<string>): Promise<any> {
        let httpRequest: WebRequest = {
            method: 'POST',
            uri: this._client.getRequestUri(`/api/publish`, queryParameters),
            body: fs.createReadStream(webPackage)
        };

        let response = await this._client.beginRequest(httpRequest, null, 'application/octet-stream');

        if (response.statusCode != 202)
            throw response;
        
        let pollableURL: string = response.headers.location;
        return await this._getDeploymentDetailsFromPollURL(pollableURL);
    }

    private async _getDeploymentDetailsFromPollURL(pollURL: string):Promise<any> {
        let httpRequest: WebRequest = {
            method: 'GET',
            uri: pollURL,
            headers: {}
        };

        while(true) {
            let response = await this._client.beginRequest(httpRequest);
            if(response.statusCode == 200) {
                let result = response.body;
                return result;
            }
            else if(response.statusCode == 202) {
                await new Promise(_ => setTimeout(_, 1000));
                continue;
            }
            else {
                throw response;
            }
        }
    }
}