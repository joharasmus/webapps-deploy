
import { WebClient, WebRequest, WebRequestOptions, WebResponse } from 'azure-actions-webclient/WebClient';


export class KuduServiceClient {
    private _accessToken: string;
    private _cookie: string[];
    private _webClient: WebClient;

    constructor(accessToken: string) {
        this._accessToken = accessToken;
        this._webClient = new WebClient();
    }

    public async beginRequest(request: WebRequest, reqOptions?: WebRequestOptions, contentType?: string): Promise<WebResponse> {
        request.headers = {};
        request.headers["Authorization"] = `Basic ${this._accessToken}`
        request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';

        if(!!this._cookie) {
            request.headers['Cookie'] = this._cookie;
        }

        let retryCount = reqOptions && typeof reqOptions.retryCount === 'number' ? reqOptions.retryCount : 5;

        while(retryCount >= 0) {
            try {
                let httpResponse = await this._webClient.sendRequest(request, reqOptions);
                if(httpResponse.headers['set-cookie'] && !this._cookie) {
                    //this._cookie = httpResponse.headers['set-cookie'];
                }

                return httpResponse;
            }
            catch(exception) {
                let exceptionString: string = exception.toString();

                if(retryCount > 0 && exceptionString.indexOf('Request timeout') != -1 && (!reqOptions || reqOptions.retryRequestTimedout)) {
                    retryCount -= 1;
                    continue;
                }

                throw exception;
            }
        }

    }
}