import plugin from "../json/plugin.json"
import {
    log_debug,
    log_error,
    log_info,
    log_warning,
} from "./backend";
import DeckyLogger from "../deps/decky_logger";

class Logger extends DeckyLogger {
    async debug(...args: any[]) {
        super.debug(this.now(), ...args);
        log_debug(args.join(' '));
    }

    async info(...args: any[]) {
        super.log(this.now(), ...args);
        log_info(args.join(' '));
    }

    async error(...args: any[]) {
        super.error(this.now(), ...args);
        log_error(args.join(' '));
    }

    async warning(...args: any[]) {
        super.warn(this.now(), ...args);
        log_warning(args.join(' '));
    }

    private now(): string {
        return (new Date).toISOString();
    }
}

const logger = new Logger(plugin.name.replaceAll(' ', ''));
export default logger;
