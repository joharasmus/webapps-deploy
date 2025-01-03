var core = require("@actions/core");

import { FormatType, SecretParser } from 'actions-secret-parser';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';

export interface ScmCredentials {
    uri: string;
    username: string;
    password: string;
}

export class PublishProfile {
    private _creds: ScmCredentials;
    private _kuduService: any;
    private static _publishProfile: PublishProfile;

    private constructor(publishProfileContent: string) {
        try {
            let secrets = new SecretParser(publishProfileContent, FormatType.XML);
            this._creds = {
                uri: secrets.getSecret("//publishProfile/@publishUrl", false),
                username: secrets.getSecret("//publishProfile/@userName", true),
                password: secrets.getSecret("//publishProfile/@userPWD", true)
            };

            if(this._creds.uri.indexOf("scm") < 0) {
                throw new Error("Publish profile does not contain kudu URL");
            }
            this._creds.uri = `https://${this._creds.uri}`;
            this._kuduService = new Kudu(this._creds.uri, {username: this._creds.username, password: this._creds.password});
        } catch(error) {
            core.error("Failed to fetch credentials from Publish Profile.");
            throw error;
        }
    }

    public static getPublishProfile(publishProfileContent: string) {
        if(!this._publishProfile) {
            this._publishProfile = new PublishProfile(publishProfileContent);
        }
        return this._publishProfile;
    }

    public get kuduService() {
        return this._kuduService;
    }
}