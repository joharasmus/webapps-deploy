
import * as os from 'node:os';

export function setSecret(secret) {
    issueCommand({}, secret);
}

function issueCommand(properties, message) {
    const cmd = new Command('add-mask', properties, message);
    process.stdout.write(cmd.toString() + os.EOL);
}

class Command {
    constructor(command, properties, message) {
        if (!command) {
            command = 'missing.command';
        }
        this.command = command;
        this.properties = properties;
        this.message = message;
    }
    toString() {
        let cmdStr = '::' + this.command;
        if (this.properties && Object.keys(this.properties).length > 0) {
            cmdStr += ' ';
            let first = true;
            for (const key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    const val = this.properties[key];
                    if (val) {
                        if (first) {
                            first = false;
                        }
                        else {
                            cmdStr += ',';
                        }
                        cmdStr += `${key}=${val}`;
                    }
                }
            }
        }
        cmdStr += `::${this.message}`;
        return cmdStr;
    }
}