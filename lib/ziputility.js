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
exports.unzip = unzip;
exports.archiveFolder = archiveFolder;
exports.getArchivedEntries = getArchivedEntries;
exports.checkIfFilesExistsInZip = checkIfFilesExistsInZip;
const core = __importStar(require("@actions/core"));
const fs = __importStar(require("node:fs"));
const io = __importStar(require("@actions/io"));
const path = __importStar(require("node:path"));
const Q = __importStar(require("q"));
const StreamZip = __importStar(require("node-stream-zip"));
var DecompressZip = require('decompress-zip');
var archiver = require('archiver');
const packageUtility_1 = require("./packageUtility");
function unzip(zipLocation, unzipLocation) {
    return __awaiter(this, void 0, void 0, function* () {
        var defer = Q.defer();
        if ((0, packageUtility_1.exist)(unzipLocation)) {
            yield io.rmRF(unzipLocation);
        }
        var unzipper = new DecompressZip(zipLocation);
        console.log('extracting ' + zipLocation + ' to ' + unzipLocation);
        unzipper.on('error', function (error) {
            defer.reject(error);
        });
        unzipper.on('extract', function (log) {
            console.log('extracted ' + zipLocation + ' to ' + unzipLocation + ' Successfully');
            defer.resolve(unzipLocation);
        });
        unzipper.extract({
            path: unzipLocation
        });
        return defer.promise;
    });
}
function archiveFolder(folderPath, targetPath, zipName) {
    return __awaiter(this, void 0, void 0, function* () {
        var defer = Q.defer();
        core.debug('Archiving ' + folderPath + ' to ' + zipName);
        var outputZipPath = path.join(targetPath, zipName);
        var output = fs.createWriteStream(outputZipPath);
        var archive = archiver('zip');
        output.on('close', function () {
            core.debug('Successfully created archive ' + zipName);
            defer.resolve(outputZipPath);
        });
        output.on('error', function (error) {
            defer.reject(error);
        });
        archive.pipe(output);
        archive.directory(folderPath, '/');
        archive.finalize();
        return defer.promise;
    });
}
/**
 *  Returns array of files present in archived package
 */
function getArchivedEntries(archivedPackage) {
    return __awaiter(this, void 0, void 0, function* () {
        var deferred = Q.defer();
        var unzipper = new DecompressZip(archivedPackage);
        unzipper.on('error', function (error) {
            deferred.reject(error);
        });
        unzipper.on('list', function (files) {
            var packageComponent = {
                "entries": files
            };
            deferred.resolve(packageComponent);
        });
        unzipper.list();
        return deferred.promise;
    });
}
function checkIfFilesExistsInZip(archivedPackage, files) {
    let deferred = Q.defer();
    for (let i = 0; i < files.length; i++) {
        files[i] = files[i].toLowerCase();
    }
    const zip = new StreamZip({
        file: archivedPackage,
        storeEntries: true,
        skipEntryNameValidation: true
    });
    zip.on('ready', () => {
        let fileCount = 0;
        for (let entry in zip.entries()) {
            if (files.indexOf(entry.toLowerCase()) != -1) {
                fileCount += 1;
            }
        }
        zip.close();
        deferred.resolve(fileCount == files.length);
    });
    zip.on('error', error => {
        deferred.reject(error);
    });
    return deferred.promise;
}
