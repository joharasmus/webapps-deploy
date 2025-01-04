import * as core from '@actions/core';
import { Document, DOMParser } from '@xmldom/xmldom';
var xpSelect = require('xpath').select;

/**
 * Takes content as string and format type (xml, json).
 * Exposes getSecret method to get value of specific secret in object and set it as secret.
 */
export class SecretParser {
    private dom: Document;

    constructor(content: string) {
        this.dom = new DOMParser().parseFromString(content, "application/xml");
    }

    /**
     * @param key xpath
     * @param isSecret should the value parsed be a secret. Deafult: true
     * @returns a string value or empty string if key not found
     */
    public getSecret(key: string, isSecret: boolean = true): string {
        
        let xpselectValue = xpSelect("string(" + key + ")", this.dom);
        if (!xpselectValue)
            return "";
        if (isSecret) {
            core.setSecret(xpselectValue)
        }

        return xpselectValue;
    }
}