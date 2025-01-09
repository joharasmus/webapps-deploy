"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const core = require("@actions/core");
const fs = require("node:fs");
const xmldom_1 = require("@xmldom/xmldom");
const Archiver = require('../lib/core').Archiver;
const HttpClient_1 = require("typed-rest-client/HttpClient");
const xPathSelect = require('xpath').select;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
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
        yield archive.directory(packageInput);
        const accessToken = Buffer.from(username + ':' + password).toString('base64');
        let deploymentDetails = yield oneDeploy(zipPackagePath, uri, accessToken);
        console.log(deploymentDetails);
    });
}
function oneDeploy(webPackage, scmUri, accessToken) {
    return __awaiter(this, void 0, void 0, function* () {
        let httpClient = new HttpClient_1.HttpClient(undefined);
        let requestUri = scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true';
        let headers = {
            'Authorization': `Basic ${accessToken}`,
            'Content-Type': 'application/octet-stream'
        };
        let body = fs.createReadStream(webPackage);
        let response = yield httpClient.request('POST', requestUri, body, headers);
        if (response.message.statusCode != 202)
            throw response;
        let pollUri = response.message.headers.location;
        headers = {
            'Authorization': `Basic ${accessToken}`,
            'Content-Type': 'application/json; charset=utf-8'
        };
        while (true) {
            yield new Promise(_ => setTimeout(_, 1000));
            let response = yield httpClient.request('GET', pollUri, '', headers);
            if (response.message.statusCode == 202)
                continue;
            if (response.message.statusCode == 200)
                return yield response.readBody();
            throw response; //another statuscode indicates something is wrong
        }
    });
}
main();
