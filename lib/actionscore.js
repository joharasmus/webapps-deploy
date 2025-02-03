
import * as os from 'node:os';

export function setSecret(secret) {
    const cmd = new Command(secret);
    process.stdout.write(cmd.toString() + os.EOL);
}

class Command {
    constructor(message) {
        this.properties = {};
        this.message = message;
    }
    toString() {
        let cmdStr = '::add-mask';
        if (this.properties && Object.keys(this.properties).length > 0) {
            console.log("YES");
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
        else
            console.log("NO");
        cmdStr += `::${this.message}`;
        return cmdStr;
    }
}