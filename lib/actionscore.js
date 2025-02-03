
import * as os from 'node:os';

export function setSecret(secret) {
    const cmd = new Command();
    let cmdStr = '::add-mask';
    cmdStr += `::${secret}`;
    process.stdout.write(cmdStr + os.EOL);
}

class Command {
    toString(message) {
        let cmdStr = '::add-mask';
        cmdStr += `::${message}`;
        return cmdStr;
    }
}