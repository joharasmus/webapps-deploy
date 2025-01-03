
import { FormatType, SecretParser } from 'actions-secret-parser';
import { Kudu } from 'azure-actions-appservice-rest/Kudu/azure-app-kudu-service';

export class PublishProfile {
    public kuduService: any;

    public constructor(publishProfileContent: string) {
        let secrets = new SecretParser(publishProfileContent, FormatType.XML);
        let uri = secrets.getSecret("//publishProfile/@publishUrl", false);
        uri = `https://${uri}`;
        let username = secrets.getSecret("//publishProfile/@userName", true);
        let password = secrets.getSecret("//publishProfile/@userPWD", true);

        this.kuduService = new Kudu(uri, {username: username, password: password});
    }
}