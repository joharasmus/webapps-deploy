import path = require('path');

import * as os from "os";

import { exist } from './packageUtility';
import { find, match } from './utilityHelperFunctions';

import zipUtility = require('./zipUtility');
import core = require('@actions/core');

export function findfiles(filepath){

    core.debug("Finding files matching input: " + filepath);

    var filesList : string [];
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {

        // No pattern found, check literal path to a single file
        if(exist(filepath)) {
            filesList = [filepath];
        }
        else {
            core.debug('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    } else {
        var firstWildcardIndex = function(str) {
            var idx = str.indexOf('*');

            var idxOfWildcard = str.indexOf('?');
            if (idxOfWildcard > -1) {
                return (idx > -1) ?
                    Math.min(idx, idxOfWildcard) : idxOfWildcard;
            }

            return idx;
        }

        // Find app files matching the specified pattern
        core.debug('Matching glob pattern: ' + filepath);

        // First find the most complete path without any matching patterns
        var idx = firstWildcardIndex(filepath);
        core.debug('Index of first wildcard: ' + idx);
        var slicedPath = filepath.slice(0, idx);
        var findPathRoot = path.dirname(slicedPath);
        if(slicedPath.endsWith("\\") || slicedPath.endsWith("/")){
            findPathRoot = slicedPath;
        }

        core.debug('find root dir: ' + findPathRoot);

        // Now we get a list of all files under this root
        var allFiles = find(findPathRoot);

        // Now matching the pattern against all files
        filesList = match(allFiles, filepath, '', {matchBase: true, nocase: !!os.type().match(/^Win/) });

        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            core.debug('No matching files were found with search pattern: ' + filepath);
            return [];
        }
    }
    return filesList;
}

export function generateTemporaryFolderOrZipPath(folderPath: string, isFolder: boolean) {
    var randomString = Math.random().toString().split('.')[1];
    var tempPath = path.join(folderPath, 'temp_web_package_' + randomString +  (isFolder ? "" : ".zip"));
    if(exist(tempPath)) {
        return generateTemporaryFolderOrZipPath(folderPath, isFolder);
    }
    return tempPath;
}

export async function archiveFolderForDeployment(isFolderBasedDeployment: boolean, folderPath: string) {
    var webDeployPkg;

    if(isFolderBasedDeployment) {
        webDeployPkg = folderPath;
    }
    else {
        var tempWebPackageZip = generateTemporaryFolderOrZipPath(`${process.env.RUNNER_TEMP}`, false);
        webDeployPkg = await zipUtility.archiveFolder(folderPath, "", tempWebPackageZip);
    }

    return {
        "webDeployPkg": webDeployPkg,
        "tempPackagePath": webDeployPkg
    };
}

export function getFileNameFromPath(filePath: string, extension?: string): string {
    var isWindows = os.type().match(/^Win/);
    var fileName;
    if(isWindows) {
        fileName = path.win32.basename(filePath, extension);
    }
    else {
        fileName = path.posix.basename(filePath, extension);
    }

    return fileName;
}

export function getTempDirectory(): string {
    return `${process.env.RUNNER_TEMP}` || os.tmpdir();
}