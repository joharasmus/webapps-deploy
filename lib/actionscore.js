
import * as os from 'node:os';

export function setSecret(secret) {
    const cmd = new Command(secret);
    process.stdout.write(cmd.toString() + os.EOL);
}

class Command {
    constructor(message) {
        this.message = message;
    }
    toString() {
        let cmdStr = '::add-mask';
        cmdStr += `::${this.message}`;
        return cmdStr;
    }
}