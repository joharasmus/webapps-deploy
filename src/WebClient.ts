import * as core from '@actions/core';

import { HttpClient, HttpClientResponse } from "typed-rest-client/HttpClient";

import { RequestClient } from './RequestClient';

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

export interface WebRequestOptions {
    retriableErrorCodes?: string[];
    retryCount?: number;
    retryIntervalInSeconds?: number;
    retriableStatusCodes?: number[];
    retryRequestTimedout?: boolean;
}

export class WebClient {
    constructor() {
        this._httpClient = RequestClient.GetInstance();
    }

    public async sendRequest(request: WebRequest): Promise<WebResponse> {

        try {
            let response = await this._httpClient.request(request.method, request.uri, request.body || '', request.headers);
            return await this._toWebResponse(response);
        }
        catch (error) {
            if (error.code) {
                core.error(error.code);
            }
            
            throw error;
        }
    }

    private async _toWebResponse(response: HttpClientResponse): Promise<WebResponse> { 
        let resBody: any;
        let body = await response.readBody();
        resBody = JSON.parse(body);

        return {
            statusCode: response.message.statusCode as number,
            statusMessage: response.message.statusMessage as string,
            headers: response.message.headers,
            body: resBody
        } as WebResponse;
    }

    private _httpClient: HttpClient;
}