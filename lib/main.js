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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("node:fs"));
const xmldom_1 = require("@xmldom/xmldom");
const core_1 = __importDefault(require("../lib/core"));
const HttpClient_1 = require("typed-rest-client/HttpClient");
var xPathSelect = require('xpath').select;
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
        let archive = new core_1.default();
        archive.pipe(output);
        archive.directory(packageInput);
        yield archive.finalize();
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
