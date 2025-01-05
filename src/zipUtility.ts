
import * as fs from 'node:fs';
import * as path from 'node:path';
import archiver from 'archiver';

export async function archiveFolder(folderPath: string, zipName: string) {

    let outputZipPath = path.join("", zipName);
    let output = fs.createWriteStream(zipName);
    
    let archive = archiver('zip');
    archive.pipe(output);
    archive.directory(folderPath, '/');
    await archive.finalize();

    return zipName;
}
