import * as fs from 'node:fs';
import * as utility from './utility';

export class PackageUtility {
    public static getPackagePath(packagePath: string): string {
        var availablePackages: string[] = utility.findfiles(packagePath);
        if(availablePackages.length == 0) {
            throw new Error('No package found with specified pattern: ' + packagePath);
        }

        if(availablePackages.length > 1) {
            throw new Error('More than one package matched with specified pattern: ' + packagePath + '. Please restrain the search pattern.');
        }

        return availablePackages[0];
    }
}

export class Package {
    constructor(packagePath: string) {
        this._path = PackageUtility.getPackagePath(packagePath);
    }

    public getPath(): string {
        return this._path;
    }
    
    private _path: string;
}

export function exist(path) {
    var exist = false;
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