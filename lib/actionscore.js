
import * as os from 'node:os';

export function setSecret(secret) {
    const cmd = new Command();
    process.stdout.write(cmd.toString(secret) + os.EOL);
}

class Command {
    toString(message) {
        let cmdStr = '::add-mask';
        cmdStr += `::${message}`;
        return cmdStr;
    }
}