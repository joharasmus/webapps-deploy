
import { HttpClient } from "typed-rest-client/HttpClient";

export interface WebResponse {
    statusCode: number;
    statusMessage: string;
    headers: any;
    body: any;
}

export class WebClient {
    constructor() {
        this._httpClient = new HttpClient(process.env.AZURE_HTTP_USER_AGENT);
    }

    public async sendRequest(method: string, uri: string, headers: any, body?: NodeJS.ReadableStream): Promise<WebResponse> {

        let response = await this._httpClient.request(method, uri, body || '', headers);
        let responseBody = await response.readBody();

        return {
            statusCode: response.message.statusCode,
            statusMessage: response.message.statusMessage,
            headers: response.message.headers,
            body: responseBody
        } as WebResponse;
    }

    private _httpClient: HttpClient;
}