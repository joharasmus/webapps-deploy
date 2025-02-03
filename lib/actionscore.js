
import * as os from 'node:os';

export function setSecret(secret) {
    let cmdStr = '::add-mask';
    cmdStr += `::${secret}`;
    process.stdout.write(cmdStr + os.EOL);
}