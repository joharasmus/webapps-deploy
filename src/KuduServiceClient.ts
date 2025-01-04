
import { WebClient, WebRequest, WebResponse } from 'azure-actions-webclient/WebClient';


export class KuduServiceClient {
    private _accessToken: string;
    private _webClient: WebClient;

    constructor(accessToken: string) {
        this._accessToken = accessToken;
        this._webClient = new WebClient();
    }

    public async beginRequest(request: WebRequest, contentType?: string): Promise<WebResponse> {
        request.headers = {};
        request.headers["Authorization"] = `Basic ${this._accessToken}`
        request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';

        let retryCount = 1;

        while(retryCount >= 0) {
            try {
                return await this._webClient.sendRequest(request);
            }
            catch(exception) {
                let exceptionString: string = exception.toString();

                if(retryCount > 0 && exceptionString.indexOf('Request timeout') != -1) {
                    retryCount -= 1;
                    continue;
                }

                throw exception;
            }
        }

    }
}