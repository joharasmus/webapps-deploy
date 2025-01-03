"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublishProfile = void 0;
const actions_secret_parser_1 = require("actions-secret-parser");
const azure_app_kudu_service_1 = require("azure-actions-appservice-rest/Kudu/azure-app-kudu-service");
class PublishProfile {
    constructor(publishProfileContent) {
        let secrets = new actions_secret_parser_1.SecretParser(publishProfileContent, actions_secret_parser_1.FormatType.XML);
        let uri = secrets.getSecret("//publishProfile/@publishUrl", false);
        uri = `https://${uri}`;
        let username = secrets.getSecret("//publishProfile/@userName", true);
        let password = secrets.getSecret("//publishProfile/@userPWD", true);
        this.kuduService = new azure_app_kudu_service_1.Kudu(uri, { username: username, password: password });
    }
}
exports.PublishProfile = PublishProfile;
