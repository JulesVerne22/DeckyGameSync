import * as plugin from "../json/plugin.json"
import {
    logDebug,
    logError,
    logInfo,
    logWarning,
} from "./backend";
import DeckyLogger from "../deps/decky_logger";

class Logger extends DeckyLogger {
    async debug(...args: any[]) {
        super.debug(this.now(), ...args);
        logDebug(args.join(' '));
    }

    async info(...args: any[]) {
        super.log(this.now(), ...args);
        logInfo(args.join(' '));
    }

    async error(...args: any[]) {
        super.error(this.now(), ...args);
        logError(args.join(' '));
    }

    async warning(...args: any[]) {
        super.warn(this.now(), ...args);
        logWarning(args.join(' '));
    }

    private now(): string {
        return (new Date).toISOString();
    }
}

const logger = new Logger(plugin.name);

export default logger;