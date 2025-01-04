import * as fs from 'fs';

import { WebClient, WebRequest } from 'azure-actions-webclient/WebClient';


export class Kudu {
    public static async oneDeploy(webPackage: string, scmUri: string, accessToken: string): Promise<any> {

        let client2 = new WebClient();

        let httpRequest: WebRequest = {
            method: 'POST',
            uri: scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true',
            headers: {
                'Authorization': `Basic ${accessToken}`,
                'Content-Type': 'application/octet-stream'
            },
            body: fs.createReadStream(webPackage)
        };

        let response = await client2.sendRequest(httpRequest);

        if (response.statusCode != 202)
            throw response;
        
        let pollableURL: string = response.headers.location;

        let pollRequest: WebRequest = {
            method: 'GET',
            uri: pollableURL,
            headers: {
                'Authorization': `Basic ${accessToken}`,
                'Content-Type': 'application/json; charset=utf-8'
            }
        };

        while(true) {
            await new Promise(_ => setTimeout(_, 1000));
    
            let response = await client2.sendRequest(pollRequest);
            
            if(response.statusCode == 202)
                continue;
            
            if(response.statusCode == 200)
                return response.body;
            
            throw response; //another statuscode indicates something is wrong
        }
    }
}