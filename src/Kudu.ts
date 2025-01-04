import * as fs from 'fs';

import { KuduServiceClient } from './KuduServiceClient';
import { WebRequest } from 'azure-actions-webclient/WebClient';


export class Kudu {
    public static async oneDeploy(webPackage: string, queryParameters: Array<string>, scmUri: string, accessToken: string): Promise<any> {

        let client = new KuduServiceClient(scmUri, accessToken);

        let httpRequest: WebRequest = {
            method: 'POST',
            uri: client.getRequestUri(`/api/publish`, queryParameters),
            body: fs.createReadStream(webPackage)
        };

        let response = await client.beginRequest(httpRequest, null, 'application/octet-stream');

        if (response.statusCode != 202)
            throw response;
        
        let pollableURL: string = response.headers.location;

        let pollRequest: WebRequest = {
            method: 'GET',
            uri: pollableURL,
            headers: {}
        };

        while(true) {
            await new Promise(_ => setTimeout(_, 1000));
    
            let response = await client.beginRequest(pollRequest);
            
            if(response.statusCode == 202)
                continue;
            
            if(response.statusCode == 200)
                return response.body;
            
            throw response; //another statuscode indicates something is wrong
        }
    }
}