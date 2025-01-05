
import * as core from '@actions/core';
import * as fs from 'node:fs';
import * as path from 'node:path';
import Q from 'q';
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
