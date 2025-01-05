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
exports.findfiles = findfiles;
exports.generateTemporaryFolderOrZipPath = generateTemporaryFolderOrZipPath;
exports.exist = exist;
exports.archiveFolder = archiveFolder;
const fs = __importStar(require("node:fs"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const utilityHelperFunctions_1 = require("./utilityHelperFunctions");
const archiver_1 = __importDefault(require("archiver"));
function findfiles(filepath) {
    var filesList;
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {
        // No pattern found, check literal path to a single file
        if (exist(filepath)) {
            filesList = [filepath];
        }
        else {
            return [];
        }
    }
    else {
        var firstWildcardIndex = function (str) {
            var idx = str.indexOf('*');
            var idxOfWildcard = str.indexOf('?');
            if (idxOfWildcard > -1) {
                return (idx > -1) ?
                    Math.min(idx, idxOfWildcard) : idxOfWildcard;
            }
            return idx;
        };
        // First find the most complete path without any matching patterns
        var idx = firstWildcardIndex(filepath);
        var slicedPath = filepath.slice(0, idx);
        var findPathRoot = path.dirname(slicedPath);
        if (slicedPath.endsWith("\\") || slicedPath.endsWith("/")) {
            findPathRoot = slicedPath;
        }
        // Now we get a list of all files under this root
        var allFiles = (0, utilityHelperFunctions_1.find)(findPathRoot);
        // Now matching the pattern against all files
        filesList = (0, utilityHelperFunctions_1.match)(allFiles, filepath, '', { matchBase: true, nocase: !!os.type().match(/^Win/) });
        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            return [];
        }
    }
    return filesList;
}
function generateTemporaryFolderOrZipPath(folderPath, isFolder) {
    var randomString = Math.random().toString().split('.')[1];
    var tempPath = path.join(folderPath, 'temp_web_package_' + randomString + (isFolder ? "" : ".zip"));
    if (exist(tempPath)) {
        return generateTemporaryFolderOrZipPath(folderPath, isFolder);
    }
    return tempPath;
}
function exist(path) {
    let exist = false;
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
function archiveFolder(folderPath, zipName) {
    return __awaiter(this, void 0, void 0, function* () {
        let output = fs.createWriteStream(zipName);
        let archive = (0, archiver_1.default)('zip');
        archive.pipe(output);
        archive.directory(folderPath, '/');
        yield archive.finalize();
    });
}
