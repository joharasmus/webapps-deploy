"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const core = __importStar(require("@actions/core"));
const fs = require('node:fs');
const xmldom_1 = require("@xmldom/xmldom");
const Archiver = require('../lib/core');
const HttpClient_1 = require("typed-rest-client/HttpClient");
const xPathSelect = require('xpath').select;
async function main() {
    let publishProfileContent = core.getInput('publish-profile');
    let packageInput = core.getInput('package');
    let publishProfileXml = new xmldom_1.DOMParser().parseFromString(publishProfileContent, "application/xml");
    let uri = xPathSelect("string(//publishProfile/@publishUrl)", publishProfileXml, true);
    uri = `https://${uri}`;
    let username = xPathSelect("string(//publishProfile/@userName)", publishProfileXml, true);
    core.setSecret(username);
    let password = xPathSelect("string(//publishProfile/@userPWD)", publishProfileXml, true);
    core.setSecret(password);
    let zipPackagePath = packageInput + ".zip";
    let output = fs.createWriteStream(zipPackagePath);
    let archive = new Archiver();
    archive.pipe(output);
    await archive.directory(packageInput);
    const accessToken = Buffer.from(username + ':' + password).toString('base64');
    let deploymentDetails = await oneDeploy(zipPackagePath, uri, accessToken);
    console.log(deploymentDetails);
}
async function oneDeploy(webPackage, scmUri, accessToken) {
    let httpClient = new HttpClient_1.HttpClient(undefined);
    let requestUri = scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true';
    let headers = {
        'Authorization': `Basic ${accessToken}`,
        'Content-Type': 'application/octet-stream'
    };
    let body = fs.createReadStream(webPackage);
    let response = await httpClient.request('POST', requestUri, body, headers);
    if (response.message.statusCode != 202)
        throw response;
    let pollUri = response.message.headers.location;
    headers = {
        'Authorization': `Basic ${accessToken}`,
        'Content-Type': 'application/json; charset=utf-8'
    };
    while (true) {
        await new Promise(_ => setTimeout(_, 1000));
        let response = await httpClient.request('GET', pollUri, '', headers);
        if (response.message.statusCode == 202)
            continue;
        if (response.message.statusCode == 200)
            return await response.readBody();
        throw response; //another statuscode indicates something is wrong
    }
}
main();
