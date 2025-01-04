"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretParser = void 0;
var core = require('@actions/core');
var domParser = require('@xmldom/xmldom').DOMParser;
var xpath = require('xpath');
/**
 * Takes content as string and format type (xml, json).
 * Exposes getSecret method to get value of specific secret in object and set it as secret.
 */
class SecretParser {
    constructor(content) {
        this.dom = new domParser().parseFromString(content, "application/xml");
    }
    /**
     * @param key jsonpath or xpath depending on content type
     * @param isSecret should the value parsed be a secret. Deafult: true
     * @param variableName optional. If provided value will be exported with this variable name
     * @returns a string value or empty string if key not found
     */
    getSecret(key, isSecret = true, variableName) {
        let value = "";
        value = this.extractXmlPath(key, isSecret, variableName);
        return value;
    }
    extractXmlPath(key, isSecret = false, variableName) {
        let value = xpath.select("string(" + key + ")", this.dom);
        return this.handleSecret(key, value, isSecret, variableName);
    }
    handleSecret(key, value, isSecret, variableName) {
        if (!!value) {
            if (isSecret) {
                core.setSecret(value);
            }
            if (!!variableName) {
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
exports.SecretParser = SecretParser;
