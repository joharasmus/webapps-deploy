
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

        try {
            return await this._webClient.sendRequest(request);
        }
        catch(exception) {
            throw exception;
        }

    }
}