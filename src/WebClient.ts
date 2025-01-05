
import { HttpClient } from "typed-rest-client/HttpClient";

export class WebClient {
    constructor() {
        this._httpClient = new HttpClient(undefined);
    }

    public async sendRequest(method: string, uri: string, headers: any, body?: NodeJS.ReadableStream): Promise<any> {

        let response = await this._httpClient.request(method, uri, body || '', headers);
        let responseBody = await response.readBody();

        return {
            statusCode: response.message.statusCode,
            statusMessage: response.message.statusMessage,
            headers: response.message.headers,
            body: responseBody
        };
    }

    private _httpClient: HttpClient;
}