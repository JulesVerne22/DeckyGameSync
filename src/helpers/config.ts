import DefaultConfig from "../json/default_config.json";
import { get_config, set_config } from "./backend";
import Logger from "./logger";

class Config {
    private data = structuredClone(DefaultConfig);

    public async load(): Promise<void> {
        let backendConfig = await get_config() as Record<string, any>;
        for (let key in this.data) {
            if (key in backendConfig) {
                try {
                    this.data[key] = backendConfig[key];
                } catch (e) {
                    console.log(e);
                }
            }
        }
        Logger.debug("Config loaded", this.data);
    }

    public get(key: string) {
        return this.data[key];
    }

    public set(key: string, value: any) {
        this.data[key] = value;
        set_config(key, value);
    }
}

const config = new Config();
await config.load();

export default config;