"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishProfile = void 0;
var core = require("@actions/core");
const actions_secret_parser_1 = require("actions-secret-parser");
const azure_app_kudu_service_1 = require("azure-actions-appservice-rest/Kudu/azure-app-kudu-service");
class PublishProfile {
    constructor(publishProfileContent) {
        try {
            let secrets = new actions_secret_parser_1.SecretParser(publishProfileContent, actions_secret_parser_1.FormatType.XML);
            this._creds = {
                uri: secrets.getSecret("//publishProfile/@publishUrl", false),
                username: secrets.getSecret("//publishProfile/@userName", true),
                password: secrets.getSecret("//publishProfile/@userPWD", true)
            };
            if (this._creds.uri.indexOf("scm") < 0) {
                throw new Error("Publish profile does not contain kudu URL");
            }
            this._creds.uri = `https://${this._creds.uri}`;
            this._kuduService = new azure_app_kudu_service_1.Kudu(this._creds.uri, { username: this._creds.username, password: this._creds.password });
        }
        catch (error) {
            core.error("Failed to fetch credentials from Publish Profile.");
            throw error;
        }
    }
    static getPublishProfile(publishProfileContent) {
        if (!this._publishProfile) {
            this._publishProfile = new PublishProfile(publishProfileContent);
        }
        return this._publishProfile;
    }
    get kuduService() {
        return this._kuduService;
    }
}
exports.PublishProfile = PublishProfile;
