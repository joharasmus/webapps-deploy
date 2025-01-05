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
exports.Package = exports.PackageUtility = void 0;
exports.exist = exist;
const fs = __importStar(require("node:fs"));
const utility = __importStar(require("./utility"));
class PackageUtility {
    static getPackagePath(packagePath) {
        var availablePackages = utility.findfiles(packagePath);
        if (availablePackages.length == 0) {
            throw new Error('No package found with specified pattern: ' + packagePath);
        }
        if (availablePackages.length > 1) {
            throw new Error('More than one package matched with specified pattern: ' + packagePath + '. Please restrain the search pattern.');
        }
        return availablePackages[0];
    }
}
exports.PackageUtility = PackageUtility;
class Package {
    constructor(packagePath) {
        this._path = PackageUtility.getPackagePath(packagePath);
    }
    getPath() {
        return this._path;
    }
}
exports.Package = Package;
function exist(path) {
    var exist = false;
    try {
        exist = path && fs.statSync(path) != null;
    }
    catch (err) {
        if (err && err.code === 'ENOENT') {
            exist = false;
        }
        else {
            throw err;
        }
    }
    return exist;
}
