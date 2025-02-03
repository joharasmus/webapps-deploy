
import * as os from 'node:os';

export function setSecret(secret) {
    const cmd = new Command(secret);
    process.stdout.write(cmd.toString(secret) + os.EOL);
}

class Command {
    constructor(message) {
        this.message = message;
    }
    toString(message) {
        let cmdStr = '::add-mask';
        cmdStr += `::${message}`;
        return cmdStr;
    }
}