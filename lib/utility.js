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
exports.findfiles = findfiles;
exports.generateTemporaryFolderOrZipPath = generateTemporaryFolderOrZipPath;
exports.archiveFolderForDeployment = archiveFolderForDeployment;
exports.getFileNameFromPath = getFileNameFromPath;
exports.getTempDirectory = getTempDirectory;
const core = __importStar(require("@actions/core"));
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const zipUtility = __importStar(require("./zipUtility"));
const packageUtility_1 = require("./packageUtility");
const utilityHelperFunctions_1 = require("./utilityHelperFunctions");
function findfiles(filepath) {
    core.debug("Finding files matching input: " + filepath);
    var filesList;
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {
        // No pattern found, check literal path to a single file
        if ((0, packageUtility_1.exist)(filepath)) {
            filesList = [filepath];
        }
        else {
            core.debug('No matching files were found with search pattern: ' + filepath);
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
        // Find app files matching the specified pattern
        core.debug('Matching glob pattern: ' + filepath);
        // First find the most complete path without any matching patterns
        var idx = firstWildcardIndex(filepath);
        core.debug('Index of first wildcard: ' + idx);
        var slicedPath = filepath.slice(0, idx);
        var findPathRoot = path.dirname(slicedPath);
        if (slicedPath.endsWith("\\") || slicedPath.endsWith("/")) {
            findPathRoot = slicedPath;
        }
        core.debug('find root dir: ' + findPathRoot);
        // Now we get a list of all files under this root
        var allFiles = (0, utilityHelperFunctions_1.find)(findPathRoot);
        // Now matching the pattern against all files
        filesList = (0, utilityHelperFunctions_1.match)(allFiles, filepath, '', { matchBase: true, nocase: !!os.type().match(/^Win/) });
        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            core.debug('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    }
    return filesList;
}
function generateTemporaryFolderOrZipPath(folderPath, isFolder) {
    var randomString = Math.random().toString().split('.')[1];
    var tempPath = path.join(folderPath, 'temp_web_package_' + randomString + (isFolder ? "" : ".zip"));
    if ((0, packageUtility_1.exist)(tempPath)) {
        return generateTemporaryFolderOrZipPath(folderPath, isFolder);
    }
    return tempPath;
}
function archiveFolderForDeployment(isFolderBasedDeployment, folderPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var webDeployPkg;
        if (isFolderBasedDeployment) {
            webDeployPkg = folderPath;
        }
        else {
            var tempWebPackageZip = generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
            webDeployPkg = yield zipUtility.archiveFolder(folderPath, "", tempWebPackageZip);
        }
        return {
            "webDeployPkg": webDeployPkg,
            "tempPackagePath": webDeployPkg
        };
    });
}
function getFileNameFromPath(filePath, extension) {
    var isWindows = os.type().match(/^Win/);
    var fileName;
    if (isWindows) {
        fileName = path.win32.basename(filePath, extension);
    }
    else {
        fileName = path.posix.basename(filePath, extension);
    }
    return fileName;
}
function getTempDirectory() {
    return `${process.env.RUNNER_TEMP}` || os.tmpdir();
}
