
import * as core from '@actions/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import Q from 'q';
import StreamZip from 'node-stream-zip';
import archiver from 'archiver';

export async function archiveFolder(folderPath, targetPath, zipName) {
    var defer = Q.defer();
    core.debug('Archiving ' + folderPath + ' to ' + zipName);
    var outputZipPath = path.join(targetPath, zipName);
    var output = fs.createWriteStream(outputZipPath);
    var archive = archiver('zip');
    output.on('close', function () {
        core.debug('Successfully created archive ' + zipName);
        defer.resolve(outputZipPath);
    });

    output.on('error', function(error) {
        defer.reject(error);
    });

    archive.pipe(output);
    archive.directory(folderPath, '/');
    archive.finalize();

    return defer.promise;
}

export function checkIfFilesExistsInZip(archivedPackage: string, files: string[]) {
    let deferred = Q.defer<boolean>();
    for(let i=0; i < files.length ; i++) {
        files[i] = files[i].toLowerCase();
    }

    const zip = new StreamZip({
        file: archivedPackage,
        storeEntries: true,
        skipEntryNameValidation: true
    });

    zip.on('ready', () => {
        let fileCount: number = 0;
        for (let entry in zip.entries()) {
            if(files.indexOf(entry.toLowerCase()) != -1) {
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
