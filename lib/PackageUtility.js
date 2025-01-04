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
exports.Package = exports.PackageUtility = exports.PackageType = void 0;
exports.exist = exist;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("node:fs"));
const utility = __importStar(require("./utility"));
const zipUtility = __importStar(require("./zipUtility"));
var PackageType;
(function (PackageType) {
    PackageType[PackageType["war"] = 0] = "war";
    PackageType[PackageType["zip"] = 1] = "zip";
    PackageType[PackageType["jar"] = 2] = "jar";
    PackageType[PackageType["folder"] = 3] = "folder";
})(PackageType || (exports.PackageType = PackageType = {}));
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
        this._isMSBuildPackage = undefined;
    }
    getPath() {
        return this._path;
    }
    isMSBuildPackage() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._isMSBuildPackage == undefined) {
                this._isMSBuildPackage = (yield this.getPackageType()) != PackageType.folder && (yield zipUtility.checkIfFilesExistsInZip(this._path, ["parameters.xml", "systeminfo.xml"]));
                core.debug("Is the package an msdeploy package : " + this._isMSBuildPackage);
            }
            return this._isMSBuildPackage;
        });
    }
    getPackageType() {
        if (this._packageType == undefined) {
            if (!exist(this._path)) {
                throw new Error('Invalidwebapppackageorfolderpathprovided' + this._path);
            }
            else {
                if (this._path.toLowerCase().endsWith('.war')) {
                    this._packageType = PackageType.war;
                    core.debug("This is war package ");
                }
                else if (this._path.toLowerCase().endsWith('.jar')) {
                    this._packageType = PackageType.jar;
                    core.debug("This is jar package ");
                }
                else if (this._path.toLowerCase().endsWith('.zip')) {
                    this._packageType = PackageType.zip;
                    core.debug("This is zip package ");
                }
                else if (fs.statSync(this._path).isDirectory()) {
                    this._packageType = PackageType.folder;
                    core.debug("This is folder package ");
                }
                else {
                    throw new Error('Invalid App Service package or folder path provided: ' + this._path);
                }
            }
        }
        return this._packageType;
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
