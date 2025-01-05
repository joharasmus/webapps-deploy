
import * as fs from 'node:fs';
import archiver from 'archiver';

export async function archiveFolder(folderPath: string, zipName: string) {

    let output = fs.createWriteStream(zipName);
    
    let archive = archiver('zip');
    archive.pipe(output);
    archive.directory(folderPath, '/');
    await archive.finalize();

    return;
}
