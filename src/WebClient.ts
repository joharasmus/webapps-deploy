
import { HttpClient } from "typed-rest-client/HttpClient";

export interface WebRequest {
    method: string;
    uri: string;
    body?: NodeJS.ReadableStream;
    headers: any;
}

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

    public async sendRequest(request: WebRequest): Promise<WebResponse> {

        let response = await this._httpClient.request(request.method, request.uri, request.body || '', request.headers);
        let body = await response.readBody();

        return {
            statusCode: response.message.statusCode,
            statusMessage: response.message.statusMessage,
            headers: response.message.headers,
            body: body
        } as WebResponse;
    }

    private _httpClient: HttpClient;
}