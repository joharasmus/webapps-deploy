import * as core from '@actions/core';
import * as fs from 'fs';

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
        let i = 0;
        let retryCount = 1;
        let retryIntervalInSeconds = 2;
        let retriableErrorCodes = ["ETIMEDOUT", "ECONNRESET", "ENOTFOUND", "ESOCKETTIMEDOUT", "ECONNREFUSED", "EHOSTUNREACH", "EPIPE", "EA_AGAIN"];
        let retriableStatusCodes = [408, 409, 500, 502, 503, 504];
        let timeToWait: number = retryIntervalInSeconds;

        while (true) {
            try {
                if (request.body && typeof(request.body) !== 'string' && !request.body["readable"]) {
                    request.body = fs.createReadStream((request as any).body["path"]);
                }

                let response: WebResponse = await this._sendRequestInternal(request);
                
                if (retriableStatusCodes.indexOf(response.statusCode) != -1 && ++i < retryCount) {
                    await this._sleep(timeToWait);
                    timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                    continue;
                }

                return response;
            }
            catch (error) {
                if (retriableErrorCodes.indexOf(error.code) != -1 && ++i < retryCount) {
                    await this._sleep(timeToWait);
                    timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                }
                else {
                    if (error.code) {
                        core.error(error.code);
                    }

                    throw error;
                }
            }
        }
    }

    private async _sendRequestInternal(request: WebRequest): Promise<WebResponse> {
        let response: HttpClientResponse = await this._httpClient.request(request.method, request.uri, request.body || '', request.headers);

        if (!response) {
            throw new Error(`Unexpected end of request. Http request: [${request.method}] ${request.uri} returned a null Http response.`);
        }

        return await this._toWebResponse(response);
    }

    private async _toWebResponse(response: HttpClientResponse): Promise<WebResponse> { 
        let resBody: any;
        let body = await response.readBody();
        if (!!body) {
            resBody = JSON.parse(body);
        }

        return {
            statusCode: response.message.statusCode as number,
            statusMessage: response.message.statusMessage as string,
            headers: response.message.headers,
            body: resBody || body
        } as WebResponse;
    }

    private _sleep(sleepDurationInSeconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }

    private _httpClient: HttpClient;
}