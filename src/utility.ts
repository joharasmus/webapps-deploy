
import * as fs from 'node:fs';

import archiver from 'archiver';


export function findfiles(filepath: string): string[] {

    return [filepath];
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

export async function archiveFolder(folderPath: string, zipName: string): Promise<void> {

    let output = fs.createWriteStream(zipName);

    let archive = archiver('zip');
    archive.pipe(output);
    archive.directory(folderPath, '/');
    await archive.finalize();
}

