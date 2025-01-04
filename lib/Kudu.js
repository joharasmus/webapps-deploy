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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Kudu = void 0;
const fs = __importStar(require("fs"));
const WebClient_1 = require("azure-actions-webclient/WebClient");
class Kudu {
    static oneDeploy(webPackage, scmUri, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            let client2 = new WebClient_1.WebClient();
            let httpRequest = {
                method: 'POST',
                uri: scmUri + '/api/publish?async=true&type=zip&clean=true&restart=true',
                headers: {
                    'Authorization': `Basic ${accessToken}`,
                    'Content-Type': 'application/octet-stream'
                },
                body: fs.createReadStream(webPackage)
            };
            let response = yield client2.sendRequest(httpRequest);
            if (response.statusCode != 202)
                throw response;
            let pollableURL = response.headers.location;
            let pollRequest = {
                method: 'GET',
                uri: pollableURL,
                headers: {
                    'Authorization': `Basic ${accessToken}`,
                    'Content-Type': 'application/json; charset=utf-8'
                }
            };
            while (true) {
                yield new Promise(_ => setTimeout(_, 1000));
                let response = yield client2.sendRequest(pollRequest);
                if (response.statusCode == 202)
                    continue;
                if (response.statusCode == 200)
                    return response.body;
                throw response; //another statuscode indicates something is wrong
            }
        });
    }
}
exports.Kudu = Kudu;
