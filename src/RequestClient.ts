import { HttpClient } from "typed-rest-client/HttpClient";
import { IRequestOptions } from "typed-rest-client/Interfaces";

export class RequestClient {
    public instance: HttpClient;
    public options: IRequestOptions;

    public constructor() {
        this.options = {};
        let ignoreSslErrors: string = "false";
        this.options.ignoreSslError = !!ignoreSslErrors && ignoreSslErrors.toLowerCase() === "true";
        this.instance = new HttpClient(`${process.env.AZURE_HTTP_USER_AGENT}`, undefined, this.options);
    }
}