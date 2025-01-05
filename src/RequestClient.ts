import { HttpClient } from "typed-rest-client/HttpClient";

export class RequestClient {
    public instance: HttpClient;

    public constructor() {
        this.instance = new HttpClient(`${process.env.AZURE_HTTP_USER_AGENT}`, undefined);
    }
}