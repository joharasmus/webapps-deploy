
import * as fs from 'node:fs';
import * as path from 'node:path';
import archiver from 'archiver';

export async function archiveFolder(folderPath: string, targetPath: string, zipName: string) {

    let outputZipPath = path.join(targetPath, zipName);
    let output = fs.createWriteStream(outputZipPath);
    
    let archive = archiver('zip');
    archive.pipe(output);
    archive.directory(folderPath, '/');
    await archive.finalize();

    return outputZipPath;
}
