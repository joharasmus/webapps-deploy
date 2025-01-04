var core = require('@actions/core');
var domParser = require('@xmldom/xmldom').DOMParser;
var xpath = require('xpath');

/**
 * Takes content as string and format type (xml, json).
 * Exposes getSecret method to get value of specific secret in object and set it as secret.
 */
export class SecretParser {
    private dom: string;

    constructor(content: string) {
        this.dom = new domParser().parseFromString(content, "application/xml");
    }

    /**
     * @param key jsonpath or xpath depending on content type
     * @param isSecret should the value parsed be a secret. Deafult: true
     * @param variableName optional. If provided value will be exported with this variable name
     * @returns a string value or empty string if key not found
     */
    public getSecret(key: string, isSecret: boolean = true, variableName?: string): string {
        let value: string = "";
        value = this.extractXmlPath(key, isSecret, variableName);

        return value;
    }
    
    private extractXmlPath(key: string, isSecret: boolean = false, variableName?: string): string {
        let value = xpath.select("string(" + key + ")", this.dom);
        return this.handleSecret(key, value, isSecret, variableName);
    }

    private handleSecret(key: string, value: string, isSecret: boolean, variableName: string): string {
        if(!!value) {
            if(isSecret) {
                core.setSecret(value);
            }
            if(!!variableName) {
                core.exportVariable(variableName, value);
            }
            return value;
        }
        else {
            core.debug("Cannot find key: " + key);
            return "";
        }
    }
}