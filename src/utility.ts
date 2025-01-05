
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { find, match } from './utilityHelperFunctions';
import archiver from 'archiver';


export function findfiles(filepath: string): string[] {

    var filesList : string [];
    if (filepath.indexOf('*') == -1 && filepath.indexOf('?') == -1) {

        // No pattern found, check literal path to a single file
        if(exist(filepath)) {
            filesList = [filepath];
        }
        else {
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

        // First find the most complete path without any matching patterns
        var idx = firstWildcardIndex(filepath);
        var slicedPath = filepath.slice(0, idx);
        var findPathRoot = path.dirname(slicedPath);
        if(slicedPath.endsWith("\\") || slicedPath.endsWith("/")){
            findPathRoot = slicedPath;
        }

        // Now we get a list of all files under this root
        var allFiles = find(findPathRoot);

        // Now matching the pattern against all files
        filesList = match(allFiles, filepath, '', {matchBase: true, nocase: !!os.type().match(/^Win/) });

        // Fail if no matching files were found
        if (!filesList || filesList.length == 0) {
            return [];
        }
    }
    return filesList;
}

export function generateTemporaryFolderOrZipPath(folderPath: string, isFolder: boolean): string {
    var randomString = Math.random().toString().split('.')[1];
    var tempPath = path.join(folderPath, 'temp_web_package_' + randomString +  (isFolder ? "" : ".zip"));
    if(exist(tempPath)) {
        return generateTemporaryFolderOrZipPath(folderPath, isFolder);
    }
    return tempPath;
}

export function exist(path: string): boolean {
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

export async function archiveFolder(folderPath: string, zipName: string) {

    let output = fs.createWriteStream(zipName);

    let archive = archiver('zip');
    archive.pipe(output);
    archive.directory(folderPath, '/');
    await archive.finalize();
}

